import type { WindsorDatePreset } from "../shared/vendors/windsor/windsor.d";

export type LookbackPreset = "3d" | "7d" | "14d" | "30d" | "90d";

export const LOOKBACK_TO_DATE_PRESET: Record<LookbackPreset, WindsorDatePreset> = {
  "3d": "last_7d",    // Windsor doesn't have last_3d, use last_7d as smallest reasonable window
  "7d": "last_7d",
  "14d": "last_30d",
  "30d": "last_30d",
  "90d": "last_90d",
};

export const LOOKBACK_TO_DAYS: Record<LookbackPreset, number> = {
  "3d": 3,
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
};

export const QUEUE_NAME = "pipeline";
export const QUEUE_PREFIX = "maxmarketing";

export type PipelineJobData = {
  /** Which phase of the pipeline to run */
  phase: "import" | "thumbnail" | "entity" | "aggregateReport" | "monitor" | "superlative" | "full";
  /** Lookback window for imports (overrides the default date_preset on each import) */
  lookback: LookbackPreset;
  /** Optional: run only specific job IDs within the phase */
  jobIds?: string[];
  /** Trigger source for logging */
  trigger: "scheduled" | "manual";
  /** Timestamp when the job was enqueued */
  enqueuedAt: string;
};
