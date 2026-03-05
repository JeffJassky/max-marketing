import { config as loadEnv } from "dotenv";
loadEnv();

import { Queue } from "bullmq";
import chalk from "chalk";
import { getRedisConnectionOpts } from "./connection";
import { QUEUE_NAME, QUEUE_PREFIX, PipelineJobData } from "./types";

const connection = getRedisConnectionOpts();
const queue = new Queue<PipelineJobData>(QUEUE_NAME, { connection, prefix: QUEUE_PREFIX });

async function setupSchedule() {
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
      repeat: {
        pattern: "0 6 * * *",
      },
      removeOnComplete: { count: 30 },
      removeOnFail: { count: 50 },
    }
  );

  console.log(chalk.green("[Scheduler] Registered daily pipeline job (6:00 AM UTC, 7d lookback)."));
  console.log(chalk.blue("[Scheduler] Scheduler is running. Press Ctrl+C to stop."));
}

setupSchedule().catch((err) => {
  console.error(chalk.red("[Scheduler] Failed to set up schedule:"), err);
  process.exit(1);
});
