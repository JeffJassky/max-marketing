import { Monitor } from "../../../../shared/data/monitor";
import { campaignConversionsMeasure } from "../campaign-daily.measures";
import { campaignDaily } from "../campaign-daily.entity";

// Detects if conversions drop significantly (e.g. tracking broke).
export const accountConversionDropMonitor = new Monitor({
  id: "account_conversion_drop_monitor",
  measureId: campaignConversionsMeasure.id,
  enabled: true,
  schedule: "0 10 * * *",
  lookbackDays: 7, // Compare against recent history
  
  scanConfig: {
    dimensions: ["account_id"],
    minVolume: 5, // Ignore accounts with very few conversions (too noisy)
  },

  strategy: {
    type: "relative_delta",
    comparison: "previous_period", // Compare yesterday vs day before (or avg of period)
    maxDeltaPct: 50, // Alert if conversions drop (or spike) by > 50%
  },
  classification: "heuristic",
}, campaignConversionsMeasure, campaignDaily);
