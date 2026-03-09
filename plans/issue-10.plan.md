# Issue #10: Worker is Restarting Due to Unknown Issues

## Summary

The DigitalOcean App Platform worker process keeps crashing and restarting. The issue requests using `doctl` to retrieve crash logs (`--type=run_restarted`) to diagnose the root cause — whether it's a memory issue, unhandled JavaScript error, or something else.

**Key finding during triage:** `doctl` is installed (v1.138.0) but **not authenticated** — the current token is invalid or expired, returning a `401 Unauthorized` error. We cannot access crash logs until authentication is restored.

## Triage Findings

### doctl Access Status
- **Installed:** ✅ `doctl` v1.138.0 is available at `/usr/local/bin/doctl`
- **Authenticated:** ❌ `doctl apps list` returns `401 Unable to authenticate you`
- **Action needed:** A valid DigitalOcean API token must be configured via `doctl auth init` before crash logs can be retrieved

### Potential Crash Causes (Code Analysis)

Without crash logs, a code review reveals several likely causes for worker restarts:

#### 1. **Unhandled Promise Rejections (HIGH likelihood)**
- `setupSchedule()` in `worker.ts` (line 41-44) catches errors but only logs them — it does **not** crash the process. However, if Redis is unavailable at startup, the BullMQ `Worker` constructor (line 46) connects immediately and may emit unhandled errors before the `worker.on("error")` handler is registered.
- No global `process.on("unhandledRejection")` handler exists in the worker entry point.

#### 2. **Memory Exhaustion (MEDIUM likelihood)**
- No `--max-old-space-size` flag is set in the `start:worker` script (`node dist/queue/worker.js`).
- The pipeline runs a full data pipeline with **all phases** sequentially (import → entity → aggregateReport → monitor → superlative), processing data from multiple vendors (Google Ads, Facebook Ads, Shopify, GA4, Instagram, GSC).
- Large Windsor API responses (up to 10-minute timeout, 600s) could accumulate in memory, especially with `response.json()` parsing full payloads.
- BigQuery operations load result sets into memory.
- Default Node.js heap limit (~1.5-2GB) may be exceeded on DigitalOcean's smaller instances.

#### 3. **Redis Connection Loss (MEDIUM likelihood)**
- `maxRetriesPerRequest: null` means BullMQ will retry indefinitely, but if the connection drops during a critical operation, the worker may crash.
- `connectTimeout: 10_000` (10s) — if Redis is slow to respond, worker could enter a crash loop.
- No reconnect strategy or health-check logging is configured.

#### 4. **Missing Environment Variables (LOW likelihood)**
- The worker loads `.env` via `dotenv` — but on DigitalOcean App Platform, env vars are set via the dashboard, not `.env` files. If `REDIS_URL` or `BIGQUERY_PROJECT` is missing, the worker throws and exits immediately.
- No validation of required env vars at startup (unlike the server which uses Zod schema validation).

#### 5. **Windsor API Timeouts Causing Cascading Failures (LOW-MEDIUM likelihood)**
- Windsor requests have a 10-minute timeout with `AbortController`. If multiple imports timeout sequentially, a single pipeline run could take an extremely long time, potentially triggering DigitalOcean's container health check timeout.

## Affected Files and Modules

| File | Relevance |
|------|-----------|
| `src/queue/worker.ts` | Main worker entry point — crash originates here |
| `src/queue/connection.ts` | Redis connection config — potential connectivity issues |
| `src/queue/pipeline.ts` | Pipeline execution — memory/error handling |
| `src/shared/vendors/windsor/windsor.ts` | Windsor API client — timeout/memory concerns |
| `src/shared/data/entityExecutor.ts` | BigQuery operations — memory/error handling |
| `package.json` | Worker start script — missing Node.js memory flags |

## Step-by-Step Implementation Plan

### Phase 1: Restore doctl Access (BLOCKER)
1. **Obtain a valid DigitalOcean API token** from the [DO control panel](https://cloud.digitalocean.com/account/api/tokens)
2. **Authenticate doctl:**
   ```bash
   doctl auth init
   ```
3. **List apps and find the MaxMarketing app ID:**
   ```bash
   doctl apps list
   ```
4. **Retrieve crash logs:**
   ```bash
   doctl apps logs <app-id> worker --type=run_restarted
   ```

### Phase 2: Analyze Crash Logs
5. Review crash logs to identify the specific error (OOM kill, JS exception, signal, etc.)
6. Categorize the crash type:
   - **OOM Kill:** Logs will show `Killed` or signal 9 — proceed with memory fixes
   - **JS Exception:** Stack trace will point to the offending code
   - **Connection Error:** Redis/MongoDB timeout errors
   - **Health Check Timeout:** Container killed due to unresponsive process

### Phase 3: Apply Targeted Fixes (based on crash log findings)

#### If Memory Issue:
7. Add `--max-old-space-size` to the worker start script in `package.json`:
   ```json
   "start:worker": "node --max-old-space-size=512 dist/queue/worker.js"
   ```
8. Implement streaming for large Windsor API responses instead of `response.json()`
9. Add explicit garbage collection points between pipeline phases

#### If Unhandled Error:
10. Add global error handlers to `worker.ts`:
    ```typescript
    process.on("unhandledRejection", (reason) => {
      console.error("[Worker] Unhandled rejection:", reason);
    });
    process.on("uncaughtException", (err) => {
      console.error("[Worker] Uncaught exception:", err);
      process.exit(1);
    });
    ```

#### If Redis Connection Issue:
11. Add reconnect strategy and connection event logging to `connection.ts`
12. Add retry logic with exponential backoff for initial Redis connection

#### General Resilience Improvements:
13. Add startup validation for required environment variables (matching server's Zod pattern)
14. Add health-check endpoint or heartbeat logging for the worker
15. Add structured logging (pino) to the worker instead of `console.log` + `chalk`

### Phase 4: Testing & Deployment
16. Test worker locally with `yarn worker` to verify error handling improvements
17. Simulate failure scenarios (kill Redis, set small memory limit, etc.)
18. Deploy to DigitalOcean and monitor for 24-48 hours

## Testing Strategy

- **Unit tests:** Test pipeline error handling — ensure individual job failures don't crash the worker
- **Integration tests:** Run worker locally with memory limits (`--max-old-space-size=256`) to reproduce OOM scenarios
- **Manual testing:** After deploying fixes, monitor DigitalOcean crash logs over 24-48 hours to confirm worker stability
- **Regression:** Ensure the daily 6:00 AM UTC pipeline completes successfully after changes

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Cannot access crash logs without doctl auth | **HIGH** | Must obtain valid DO API token first — this is a blocker |
| Fix addresses wrong root cause | **MEDIUM** | Crash logs are essential before implementing fixes; code analysis alone is insufficient |
| Memory fix causes pipeline to fail (too restrictive) | **LOW** | Start with conservative limits, monitor, adjust |
| Worker changes break scheduler or queue | **LOW** | Changes to error handling are additive, not destructive |
| Fix requires DigitalOcean app spec changes | **LOW** | May need to adjust instance size or add health checks in DO dashboard |

## Immediate Next Steps

1. **⚠️ BLOCKER:** Authenticate `doctl` with a valid API token
2. Retrieve and analyze crash logs
3. Based on findings, implement the appropriate fix from Phase 3
4. Test and deploy
