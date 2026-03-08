# Issue #5: Worker is not running — Redis Connection Timeout

## Summary

The BullMQ worker process fails to connect to Redis, producing repeated `ETIMEDOUT` errors from `ioredis` via `TLSSocket`. The worker crashes and cannot process any queued jobs. The stack trace indicates a TLS connection attempt that times out, suggesting either:

1. The Redis server is unreachable (wrong host/port, firewall, or server down)
2. A TLS misconfiguration (e.g., `rediss://` protocol used but Redis server doesn't support TLS, or vice versa)
3. No connection retry/backoff strategy, so transient failures become permanent crashes

The most recent commit (`bcb8466`) added optional TLS support, which is the likely trigger — the `tls: {}` empty object may lack required options (e.g., `rejectUnauthorized`) for the target Redis provider, or the `REDIS_URL` protocol was changed to `rediss://` without the server supporting it.

## Affected Files and Modules

| File | Role | Changes Needed |
|------|------|----------------|
| `src/queue/connection.ts` | Redis connection config | Add retry strategy, timeouts, TLS options, diagnostic logging |
| `src/queue/worker.ts` | Worker process | Add graceful shutdown, improve error handling on startup, prevent hard crash on schedule failure |

## Root Cause Analysis

1. **TLS configuration is too bare.** When TLS is enabled, the connection spreads `tls: {}` — an empty object. Many managed Redis providers (e.g., Render, Railway, Upstash) require `rejectUnauthorized: false` or specific TLS settings. An empty TLS config can cause silent handshake failures that surface as `ETIMEDOUT`.

2. **No ioredis retry strategy.** The connection options don't include `retryStrategy` or `reconnectOnError`, so ioredis uses its defaults. When initial connection fails, the worker logs errors but the `setupSchedule()` call fails and exits the process (`process.exit(1)`), making the worker unable to recover from transient Redis unavailability.

3. **No connection timeout.** Without an explicit `connectTimeout`, ioredis waits for the OS-level TCP timeout (often 30+ seconds per attempt), causing the slow cascade of `ETIMEDOUT` errors seen in the logs.

4. **Startup is fatal.** `setupSchedule()` runs immediately and calls `process.exit(1)` on failure, meaning the worker can never recover from a temporarily unavailable Redis.

## Step-by-Step Implementation

### Step 1: Harden TLS configuration in `connection.ts`

Add `rejectUnauthorized: false` to the TLS options (standard for managed Redis providers that use self-signed or provider-managed certificates):

```typescript
...(useTls && { tls: { rejectUnauthorized: false } }),
```

### Step 2: Add ioredis connection options in `connection.ts`

Add explicit timeout and retry-related fields to the returned connection object:

```typescript
return {
  host: parsed.hostname,
  port: parseInt(parsed.port || "6379", 10),
  password: parsed.password || undefined,
  username: parsed.username || undefined,
  maxRetriesPerRequest: null as null,
  connectTimeout: 10_000,           // 10s connect timeout (vs OS default ~30s+)
  enableReadyCheck: true,            // verify connection is truly ready
  ...(useTls && { tls: { rejectUnauthorized: false } }),
};
```

### Step 3: Add diagnostic logging in `connection.ts`

Export a helper or log the connection target (host:port, TLS yes/no) at startup so operators can verify the worker is pointing at the right Redis instance — without leaking passwords:

```typescript
export const getRedisConnectionOpts = () => {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set. Please configure it in your .env file.");
  }

  const parsed = new URL(url);
  const useTls = parsed.protocol === "rediss:" || process.env.REDIS_TLS === "1";

  console.log(
    `[Redis] Connecting to ${parsed.hostname}:${parsed.port || 6379} (TLS: ${useTls ? "yes" : "no"})`
  );

  return { /* ... */ };
};
```

### Step 4: Make worker startup resilient in `worker.ts`

Replace the fatal `process.exit(1)` on schedule setup failure with a retry or warning-only approach:

```typescript
setupSchedule().catch((err) => {
  console.error(chalk.red("[Worker] Failed to set up schedule:"), err);
  console.error(chalk.yellow("[Worker] Will retry schedule setup when connection is restored."));
  // Don't exit — the worker event loop and ioredis reconnection will keep trying
});
```

### Step 5: Add graceful shutdown handling in `worker.ts`

Ensure the worker shuts down cleanly on `SIGTERM`/`SIGINT` to avoid orphaned connections:

```typescript
async function shutdown() {
  console.log(chalk.yellow("[Worker] Shutting down gracefully..."));
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

## Testing Strategy

1. **Unit / Local verification:**
   - Set `REDIS_URL` to an invalid host and verify the worker logs a clear diagnostic message and does not immediately crash
   - Set `REDIS_URL` to a valid Redis instance and verify the worker connects and registers the schedule
   - Toggle `REDIS_TLS=1` and verify TLS options are correctly applied

2. **TLS-specific testing:**
   - Connect to a managed Redis provider (e.g., Render Redis, Upstash) using `rediss://` URL
   - Verify the `rejectUnauthorized: false` option allows the TLS handshake to succeed

3. **Resilience testing:**
   - Start the worker with Redis unavailable, then start Redis — verify the worker recovers and begins processing
   - Kill Redis while the worker is running — verify the worker logs errors but does not crash, and recovers when Redis returns

4. **Deployment verification:**
   - Deploy to the hosting environment and confirm the `[Worker] Listening on queue` log message appears
   - Trigger a manual job via `enqueue` and verify it completes

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| `rejectUnauthorized: false` weakens TLS certificate validation | Low | Standard practice for managed Redis; can be made configurable via env var if stricter validation is needed later |
| Removing `process.exit(1)` on schedule failure means the worker runs without a schedule | Low | The worker still processes manually enqueued jobs; schedule setup will succeed once Redis connects via ioredis auto-reconnect |
| Changes don't fix the root cause if Redis is genuinely unreachable (wrong URL, server down) | Medium | Diagnostic logging will make it immediately obvious what host/port/TLS the worker is targeting, enabling faster debugging |
| `connectTimeout: 10_000` may be too short for slow networks | Low | 10s is generous for most deployments; can be made configurable via `REDIS_CONNECT_TIMEOUT` env var if needed |
