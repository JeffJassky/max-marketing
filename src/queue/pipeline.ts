import chalk from "chalk";
import { discoverJobs, executeJob, LoadedJob } from "../cli/index";
import { WindsorImportExecutor } from "../shared/vendors/windsor/windsorPresetExecutor";
import { EntityExecutor } from "../shared/data/entityExecutor";
import { AggregateReportExecutor } from "../shared/data/aggregateReportExecutor";
import { MonitorExecutor } from "../shared/data/monitorExecutor";
import { SuperlativeExecutor } from "../shared/data/superlativeExecutor";
import { BronzeImport, Entity, AggregateReport } from "../jobs/base";
import { Monitor } from "../shared/data/monitor";
import { LookbackPreset, LOOKBACK_TO_DATE_PRESET, LOOKBACK_TO_DAYS } from "./types";
import type { WindsorDatePreset } from "../shared/vendors/windsor/windsor.d";

export interface PipelineRunOptions {
  lookback: LookbackPreset;
  phases?: ("import" | "entity" | "aggregateReport" | "monitor" | "superlative")[];
  jobIds?: string[];
}

interface PipelineResult {
  phase: string;
  jobId: string;
  success: boolean;
  error?: string;
  rowCount?: number;
}

/**
 * Runs the full data pipeline (or specific phases) with a configurable lookback window.
 * This is the core logic shared by both the BullMQ worker and the CLI.
 */
export async function runPipeline(options: PipelineRunOptions): Promise<PipelineResult[]> {
  const results: PipelineResult[] = [];
  const allJobs = await discoverJobs();
  const projectId = process.env.BIGQUERY_PROJECT;

  if (!projectId) {
    throw new Error("BIGQUERY_PROJECT is not set.");
  }

  const phases = options.phases || ["import", "entity", "aggregateReport", "monitor", "superlative"];
  const datePreset = LOOKBACK_TO_DATE_PRESET[options.lookback];

  for (const phase of phases) {
    let phaseJobs = allJobs.filter((j) => j.type === phase);

    // Filter to specific job IDs if provided
    if (options.jobIds && options.jobIds.length > 0) {
      phaseJobs = phaseJobs.filter((j) => options.jobIds!.includes(j.id));
    }

    if (phaseJobs.length === 0) continue;

    console.log(chalk.cyan(`\n--- Phase: ${phase} (${phaseJobs.length} jobs, lookback: ${options.lookback}) ---`));

    for (const job of phaseJobs) {
      const result: PipelineResult = { phase, jobId: job.id, success: false };

      try {
        if (phase === "import") {
          const executor = new WindsorImportExecutor();
          const importResult = await executor.run(job.instance as BronzeImport<any, any>, {
            requestOverrides: { date_preset: datePreset },
          });
          result.rowCount = importResult.rowCount;
        } else if (phase === "entity") {
          const executor = new EntityExecutor(projectId);
          const incrementalDays = LOOKBACK_TO_DAYS[options.lookback];
          await executor.run(job.instance as Entity<any>, { incrementalDays });
        } else if (phase === "aggregateReport") {
          const executor = new AggregateReportExecutor(projectId);
          await executor.run(job.instance as AggregateReport<any>);
        } else if (phase === "monitor") {
          const executor = new MonitorExecutor(projectId);
          const instance = job.instance as Monitor;
          await executor.run(instance.definition, instance.measure, instance.entity as Entity<any>);
        } else if (phase === "superlative") {
          const executor = new SuperlativeExecutor(projectId);
          await executor.run([job.instance as Entity<any>], { lookbackMonths: 3 });
        }

        result.success = true;
        console.log(chalk.green(`  [OK] ${job.id}${result.rowCount != null ? ` (${result.rowCount} rows)` : ""}`));
      } catch (error: any) {
        result.error = error?.message ?? "Unknown error";
        console.log(chalk.red(`  [FAIL] ${job.id}: ${result.error}`));
      }

      results.push(result);
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(chalk.cyan(`\nPipeline complete: ${succeeded} succeeded, ${failed} failed.`));

  return results;
}
