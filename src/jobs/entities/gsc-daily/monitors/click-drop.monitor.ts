import { Monitor } from "../../../../shared/data/monitor";
import { gscClicksMeasure } from "../gsc-daily.measures";
import { gscDaily } from "../gsc-daily.entity";

/**
 * Click Drop Monitor
 *
 * Detects significant drops in organic search clicks at the account level.
 * Good for: Identifying overall SEO health issues, algorithm impacts, or indexing problems.
 */
export const gscClickDropMonitor = new Monitor({
  id: "gsc_click_drop_monitor",
  measureId: gscClicksMeasure.id,
  enabled: true,
  schedule: "0 10 * * *", // Run daily at 10am
  lookbackDays: 14, // 2 weeks window for comparison

  scanConfig: {
    dimensions: ["account_id"],
    minVolume: 50, // Ignore accounts with < 50 clicks total in the period
  },

  strategy: {
    type: "relative_delta",
    comparison: "previous_period",
    maxDeltaPct: 40, // Alert if clicks drop by more than 40%
  },
  classification: "heuristic",
  impact: {
    type: "performance",
    unit: "clicks",
    multiplier: 1,
  },
}, gscClicksMeasure, gscDaily);
