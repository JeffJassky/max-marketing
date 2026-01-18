import { Monitor } from "../../../../shared/data/monitor";
import { gscPositionMeasure } from "../gsc-daily.measures";
import { gscDaily } from "../gsc-daily.entity";

/**
 * Position Drop Monitor
 *
 * Detects significant ranking drops for high-value queries.
 * Good for: Algorithm updates, technical SEO issues, or competitor gains.
 */
export const gscPositionDropMonitor = new Monitor({
  id: "gsc_position_drop_monitor",
  measureId: gscPositionMeasure.id,
  enabled: true,
  schedule: "0 9 * * *", // Run daily at 9am
  lookbackDays: 14, // 2 weeks window for comparison

  scanConfig: {
    dimensions: ["account_id", "query"],
    minVolume: 100, // Ignore queries with < 100 impressions
  },

  strategy: {
    type: "relative_delta",
    comparison: "previous_period",
    maxDeltaPct: 30, // Alert if position increases (worsens) by more than 30%
  },
  classification: "heuristic",
  impact: {
    type: "performance",
    unit: "position",
    multiplier: 1,
  },
}, gscPositionMeasure, gscDaily);
