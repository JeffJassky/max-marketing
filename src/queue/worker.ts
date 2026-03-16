import { config as loadEnv } from "dotenv";
loadEnv();

// --- Global error handlers (must be registered before any async work) ---
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Worker] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Worker] Uncaught exception:", err);
  process.exit(1);
});

import { Queue, Worker, Job } from "bullmq";
import chalk from "chalk";
import { getRedisConnectionOpts } from "./connection";
import { QUEUE_NAME, QUEUE_PREFIX, PipelineJobData } from "./types";
import { runPipeline } from "./pipeline";

// --- Startup environment validation ---
const REQUIRED_ENV = ["REDIS_URL", "BIGQUERY_PROJECT", "GOOGLE_APPLICATION_CREDENTIALS_BASE64"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[Worker] Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

// --- Memory usage logging (every 60 seconds) ---
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(
    `[Worker] Memory: heap=${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB, rss=${Math.round(mem.rss / 1024 / 1024)}MB`
  );
}, 60_000).unref();

const connection = getRedisConnectionOpts();

// --- Schedule setup (runs once on startup) ---
async function setupSchedule() {
  const queue = new Queue<PipelineJobData>(QUEUE_NAME, { connection, prefix: QUEUE_PREFIX });

  // Remove any existing repeatable jobs to avoid duplicates on restart
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    await queue.removeRepeatableByKey(job.key);
  }

  // Daily full pipeline at 6:00 AM UTC with 7-day lookback
  await queue.add(
    "daily-pipeline",
    {
      phase: "full",
      lookback: "7d",
      trigger: "scheduled",
      enqueuedAt: new Date().toISOString(),
    },
    {
      repeat: { pattern: "0 6 * * *" },
      removeOnComplete: { count: 30 },
      removeOnFail: { count: 50 },
      attempts: 3,
      backoff: { type: "exponential", delay: 300_000 }, // 5min, 10min, 20min
    }
  );

  console.log(chalk.green("[Worker] Registered daily pipeline schedule (6:00 AM UTC, 7d lookback)."));
}

setupSchedule().catch((err) => {
  console.error(chalk.red("[Worker] Failed to set up schedule:"), err);
  console.error(chalk.yellow("[Worker] Will retry schedule setup when connection is restored."));
});

const worker = new Worker<PipelineJobData>(
  QUEUE_NAME,
  async (job: Job<PipelineJobData>) => {
    const { phase, lookback, jobIds, trigger } = job.data;

    console.log(
      chalk.blue(
        `[Worker] Processing job ${job.id} | phase=${phase} lookback=${lookback} trigger=${trigger}`
      )
    );

    const phases =
      phase === "full"
        ? (["import", "thumbnail", "entity", "aggregateReport", "monitor", "superlative"] as const)
        : [phase] as const;

    const results = await runPipeline({
      lookback,
      phases: [...phases],
      jobIds,
    });

    const failed = results.filter((r) => !r.success);
    const importFailures = failed.filter((f) => f.phase === "import");

    if (failed.length > 0) {
      console.warn(
        chalk.yellow(
          `[Worker] ${failed.length} job(s) failed: ${failed.map((f) => f.jobId).join(", ")}`
        )
      );
    }

    const summary = {
      total: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: failed.length,
      failures: failed.map((f) => ({ jobId: f.jobId, error: f.error })),
    };

    // If import jobs failed, throw so BullMQ marks the job as failed and retries
    if (importFailures.length > 0) {
      const err = new Error(
        `${importFailures.length} import(s) failed: ${importFailures.map((f) => f.jobId).join(", ")}. ` +
        `Pipeline completed ${summary.succeeded}/${summary.total} jobs.`
      );
      (err as any).summary = summary;
      throw err;
    }

    return summary;
  },
  {
    connection,
    prefix: QUEUE_PREFIX,
    concurrency: 1,
  }
);

worker.on("completed", (job) => {
  console.log(chalk.green(`[Worker] Job ${job?.id} completed.`));
});

worker.on("failed", (job, err) => {
  console.log(chalk.red(`[Worker] Job ${job?.id} failed: ${err.message}`));
});

worker.on("error", (err) => {
  console.error(chalk.red(`[Worker] Error: ${err.message}`));
});

worker.on("ready", () => {
  console.log(chalk.green("[Worker] Redis connection ready."));
});

worker.on("closing", () => {
  console.log(chalk.yellow("[Worker] Redis connection closing."));
});

worker.on("closed", () => {
  console.log(chalk.yellow("[Worker] Redis connection closed."));
});

console.log(chalk.blue(`[Worker] Listening on queue "${QUEUE_NAME}" (with scheduler)...`));

// --- Graceful shutdown ---
async function shutdown() {
  console.log(chalk.yellow("[Worker] Shutting down gracefully..."));
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
