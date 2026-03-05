import { config as loadEnv } from "dotenv";
loadEnv();

import { Queue } from "bullmq";
import chalk from "chalk";
import { getRedisConnectionOpts } from "./connection";
import { QUEUE_NAME, QUEUE_PREFIX, PipelineJobData, LookbackPreset } from "./types";

const connection = getRedisConnectionOpts();
const queue = new Queue<PipelineJobData>(QUEUE_NAME, { connection, prefix: QUEUE_PREFIX });

/**
 * Enqueue a pipeline job onto the BullMQ queue.
 * Used by the CLI and could be used by an API endpoint.
 */
export async function enqueuePipeline(options: {
  phase?: PipelineJobData["phase"];
  lookback?: LookbackPreset;
  jobIds?: string[];
}): Promise<string> {
  const data: PipelineJobData = {
    phase: options.phase || "full",
    lookback: options.lookback || "7d",
    jobIds: options.jobIds,
    trigger: "manual",
    enqueuedAt: new Date().toISOString(),
  };

  const job = await queue.add("manual-pipeline", data, {
    removeOnComplete: { count: 30 },
    removeOnFail: { count: 50 },
  });

  return job.id!;
}

// When run directly from CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const lookbackArg = args.find((a) => a.startsWith("--lookback="));
  const phaseArg = args.find((a) => a.startsWith("--phase="));

  const lookback = (lookbackArg?.split("=")[1] || "7d") as LookbackPreset;
  const phase = (phaseArg?.split("=")[1] || "full") as PipelineJobData["phase"];

  enqueuePipeline({ lookback, phase })
    .then((jobId) => {
      console.log(chalk.green(`Enqueued pipeline job: ${jobId} (phase=${phase}, lookback=${lookback})`));
      process.exit(0);
    })
    .catch((err) => {
      console.error(chalk.red("Failed to enqueue:"), err.message);
      process.exit(1);
    });
}
