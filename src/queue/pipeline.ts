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
  phases?: ("import" | "thumbnail" | "entity" | "aggregateReport" | "monitor" | "superlative")[];
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

  const phases = options.phases || ["import", "thumbnail", "entity", "aggregateReport", "monitor", "superlative"];
  const datePreset = LOOKBACK_TO_DATE_PRESET[options.lookback];

  for (const phase of phases) {
    // Thumbnail phase is handled separately — it doesn't use job discovery
    if (phase === "thumbnail") {
      if (process.env.S3_BUCKET) {
        console.log(chalk.cyan(`\n--- Phase: thumbnail (S3 sync) ---`));
        try {
          const { syncThumbnails } = await import("../shared/vendors/aws/thumbnailSync");
          const { socialMediaThumbnailConfigs } = await import("../jobs/thumbnails/socialMedia.thumbnail");
          const { creativeAdsThumbnailConfigs } = await import("../jobs/thumbnails/creativeAds.thumbnail");
          const allConfigs = [...socialMediaThumbnailConfigs, ...creativeAdsThumbnailConfigs];

          for (const config of allConfigs) {
            const stats = await syncThumbnails(config);
            const result: PipelineResult = {
              phase: "thumbnail",
              jobId: `thumbnail_${config.platform}`,
              success: true,
              rowCount: stats.uploaded,
            };
            results.push(result);
            console.log(
              chalk.green(
                `  [OK] ${config.platform}: ${stats.uploaded} uploaded, ${stats.skipped} skipped, ${stats.failed} failed (${stats.checked} checked)`
              )
            );
          }
        } catch (error: any) {
          const result: PipelineResult = {
            phase: "thumbnail",
            jobId: "thumbnail_sync",
            success: false,
            error: error?.message ?? "Unknown error",
          };
          results.push(result);
          console.log(chalk.red(`  [FAIL] thumbnail sync: ${result.error}`));
        }
      } else {
        console.log(chalk.gray(`\n--- Phase: thumbnail (skipped — S3_BUCKET not configured) ---`));
      }
      continue;
    }

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
