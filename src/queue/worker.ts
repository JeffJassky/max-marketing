import { config as loadEnv } from "dotenv";
loadEnv();

import { Queue, Worker, Job } from "bullmq";
import chalk from "chalk";
import { getRedisConnectionOpts } from "./connection";
import { QUEUE_NAME, QUEUE_PREFIX, PipelineJobData } from "./types";
import { runPipeline } from "./pipeline";

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
    if (failed.length > 0) {
      console.warn(
        chalk.yellow(
          `[Worker] ${failed.length} job(s) failed: ${failed.map((f) => f.jobId).join(", ")}`
        )
      );
    }

    return {
      total: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: failed.length,
      failures: failed.map((f) => ({ jobId: f.jobId, error: f.error })),
    };
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

console.log(chalk.blue(`[Worker] Listening on queue "${QUEUE_NAME}" (with scheduler)...`));

// --- Graceful shutdown ---
async function shutdown() {
  console.log(chalk.yellow("[Worker] Shutting down gracefully..."));
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
