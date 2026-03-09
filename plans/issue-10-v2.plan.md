# Issue #10 (Attempt 2): Worker is Restarting Due to Unknown Issues

## Summary

The DigitalOcean App Platform worker process for maxed-marketing keeps crashing and restarting. This is the second attempt at diagnosing and resolving this issue.

## What Went Wrong with the Previous Attempt

The first attempt (v1) was **blocked** because `doctl` was not authenticated — it returned `401 Unauthorized` when trying to access crash logs. The plan was entirely theoretical: it identified 5 potential crash causes via code review but could not confirm any of them. No code changes were made.

**This attempt differs** because `doctl` is now authenticated and we have full access to DigitalOcean's tooling. We were able to:
1. List apps and identify the maxed-marketing app ID (`566f59f5-d3de-44e5-88ec-118877a99ea8`)
2. Retrieve the app spec and confirm worker configuration
3. Pull runtime logs (`--type=run`) and crash logs (`--type=run_restarted`)

## Triage Findings (with doctl Access)

### doctl Access: WORKING
- **App ID:** `566f59f5-d3de-44e5-88ec-118877a99ea8`
- **Worker component:** `worker` (run command: `yarn start:worker`)
- **Instance size:** `apps-s-1vcpu-1gb-fixed` — **only 1 vCPU, 1GB RAM**

### Crash Logs (`--type=run_restarted`)
**Result: Empty.** The `run_restarted` log type returned no output. This means either:
- The crash logs have been rotated/expired (DigitalOcean only keeps the last crash)
- The most recent restart was a clean deployment, not a crash

### Runtime Logs (`--type=run`)
The current worker run (deployed at 19:22 UTC on 2026-03-09) appears healthy:
- Worker starts, connects to Redis (TLS), registers daily schedule
- Processes a full pipeline job: import (26 jobs) → entity → aggregateReport (16 jobs) → monitor
- All jobs complete successfully (`[OK]`)
- Largest dataset: **65,690 rows** for `ga4PagePerformanceBreakdown`
- Non-fatal warning at startup: `wrapAnsi is not a function` (chalk/terminal compat issue)

### Root Cause Analysis

Since crash logs are empty, we must rely on infrastructure constraints + code analysis:

#### 1. **Memory Exhaustion on 1GB Instance (HIGH likelihood)**
- The worker runs on `apps-s-1vcpu-1gb-fixed` — only **1GB total RAM** (not just for Node.js — this includes the OS, container overhead, etc.)
- Node.js default heap limit is ~1.5GB, which exceeds the container's total RAM
- No `--max-old-space-size` flag is set in `start:worker` script
- The full pipeline processes 26 import jobs (with 10-minute API timeouts each), 14+ entity jobs, 16 aggregate reports, and 16 monitors — all sequentially in a single process
- The `ga4PagePerformanceBreakdown` report alone processes 65,690 rows into memory
- **On a 1GB instance, this is very likely to trigger an OOM kill** — the kernel kills the process with SIGKILL (signal 9), which produces no JavaScript stack trace and may not even produce crash logs

#### 2. **Unhandled Promise Rejections (MEDIUM likelihood)**
- No `process.on("unhandledRejection")` or `process.on("uncaughtException")` handlers
- The BullMQ Worker constructor (line 46) connects to Redis immediately. If it fails before the `worker.on("error")` handler is registered (line 99-101), the error is unhandled
- `setupSchedule()` catches its own errors but logs and continues — however transient Redis issues during schedule setup could cascade

#### 3. **No Observability into Crashes (makes all issues harder to diagnose)**
- No structured logging (just `console.log` + chalk)
- No memory usage reporting
- No heartbeat/health-check logging
- When the process is OOM-killed, there's no pre-death log to indicate memory pressure

## Affected Files and Modules

| File | Change | Purpose |
|------|--------|---------|
| `package.json` | Modify `start:worker` script | Set `--max-old-space-size=768` to stay within 1GB container |
| `src/queue/worker.ts` | Add global error handlers, memory logging, startup validation | Prevent silent crashes, add observability |
| `src/queue/connection.ts` | Add connection event logging | Diagnose Redis disconnections |

## Step-by-Step Implementation Plan

### Step 1: Set Node.js Memory Limit (Critical)
**File:** `package.json`

Change `start:worker` from:
```json
"start:worker": "node dist/queue/worker.js"
```
to:
```json
"start:worker": "node --max-old-space-size=768 dist/queue/worker.js"
```

**Why 768MB?** The container has 1GB total. Reserving ~256MB for the OS/container overhead and Redis connections leaves ~768MB for the Node.js heap. This prevents Node.js from growing past the container limit and triggering an OOM kill. Instead, Node.js will throw a JavaScript `heap out of memory` error that can be caught and logged.

### Step 2: Add Global Error Handlers (Critical)
**File:** `src/queue/worker.ts`

Add at the top of the file (after imports, before any async work):
```typescript
// --- Global error handlers (must be registered before any async work) ---
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Worker] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Worker] Uncaught exception:", err);
  process.exit(1);
});
```

This ensures:
- Unhandled promise rejections are logged (not silently swallowed)
- Uncaught exceptions are logged before the process exits
- Both are registered before `getRedisConnectionOpts()` or `new Worker()` are called

### Step 3: Add Memory Usage Logging (Observability)
**File:** `src/queue/worker.ts`

Add a periodic memory reporter:
```typescript
// --- Memory usage logging (every 60 seconds) ---
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(
    `[Worker] Memory: heap=${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB, rss=${Math.round(mem.rss / 1024 / 1024)}MB`
  );
}, 60_000).unref();
```

This will:
- Log heap and RSS memory every 60 seconds
- Show memory trends leading up to any crash
- `.unref()` prevents this timer from keeping the process alive during shutdown

### Step 4: Add Startup Environment Validation
**File:** `src/queue/worker.ts`

Add validation for required env vars before attempting connections:
```typescript
const REQUIRED_ENV = ["REDIS_URL", "BIGQUERY_PROJECT", "GOOGLE_APPLICATION_CREDENTIALS_BASE64"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[Worker] Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
```

### Step 5: Add Redis Connection Event Logging
**File:** `src/queue/worker.ts`

After the worker is created, add connection state logging:
```typescript
worker.on("ready", () => {
  console.log("[Worker] Redis connection ready.");
});

worker.on("closing", () => {
  console.log("[Worker] Redis connection closing.");
});

worker.on("closed", () => {
  console.log("[Worker] Redis connection closed.");
});
```

## Testing Strategy

1. **Local smoke test:** Run `yarn worker` locally and verify:
   - Global error handlers are registered (inject a test rejection)
   - Memory logging appears every 60 seconds
   - Env var validation catches missing vars
2. **Memory limit test:** Run with `node --max-old-space-size=128 dist/queue/worker.js` to verify the heap limit is respected and produces a catchable error rather than a silent kill
3. **Post-deploy monitoring:** After merging to `main` and deploying:
   - Monitor runtime logs for 24-48 hours
   - Check memory usage trends via the periodic logging
   - Verify the daily 6:00 AM UTC pipeline completes without restarts
   - If restarts continue, the memory logs will now show the trend leading up to the crash

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| 768MB heap limit is too restrictive for full pipeline | **MEDIUM** | Monitor memory logs; can adjust to 896MB if needed. Current data volumes (65K rows max) should fit comfortably. |
| Memory logging adds minor overhead | **LOW** | 60-second interval is negligible; `.unref()` prevents shutdown interference |
| Changes break existing worker behavior | **LOW** | All changes are additive — error handlers, logging, and validation don't alter the pipeline logic |
| Root cause is something other than memory | **MEDIUM** | The observability improvements (memory logging, global error handlers, connection events) will capture the actual cause on the next crash |

## Key Difference from Attempt 1

| Aspect | Attempt 1 | Attempt 2 |
|--------|-----------|-----------|
| doctl access | ❌ Blocked (401 Unauthorized) | ✅ Working — retrieved logs and app spec |
| Crash logs | Not available | Retrieved but empty (no recent crashes in buffer) |
| App spec reviewed | No | Yes — confirmed 1GB instance, `yarn start:worker` command |
| Runtime logs reviewed | No | Yes — confirmed healthy run, 65K row peak, `wrapAnsi` warning |
| Actionable fixes | Deferred pending auth | Concrete: memory limit, error handlers, observability |
| Approach | Wait for crash logs then fix | Proactive: fix most likely cause (OOM on 1GB) + add observability for any remaining issues |
