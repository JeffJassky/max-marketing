import { Monitor } from "../../../../shared/data/monitor";
import { gscImpressionsMeasure } from "../gsc-daily.measures";
import { gscDaily } from "../gsc-daily.entity";

/**
 * Impression Drop Monitor
 *
 * Detects significant drops in organic search impressions.
 * Good for: Indexing issues, deindexing, or major algorithm changes affecting visibility.
 */
export const gscImpressionDropMonitor = new Monitor({
  id: "gsc_impression_drop_monitor",
  measureId: gscImpressionsMeasure.id,
  enabled: true,
  schedule: "0 10 * * *", // Run daily at 10am
  lookbackDays: 14, // 2 weeks window for comparison

  scanConfig: {
    dimensions: ["account_id"],
    minVolume: 100, // Ignore accounts with < 100 impressions total in the period
  },

  strategy: {
    type: "relative_delta",
    comparison: "previous_period",
    maxDeltaPct: 50, // Alert if impressions drop by more than 50%
  },
  classification: "heuristic",
  impact: {
    type: "performance",
    unit: "impressions",
    multiplier: 1,
  },
}, gscImpressionsMeasure, gscDaily);
