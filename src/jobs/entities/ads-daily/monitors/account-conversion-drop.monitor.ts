import { Monitor } from "../../../../shared/data/monitor";
import { adsConversionsMeasure } from "../ads-daily.measures";
import { adsDaily } from "../ads-daily.entity";

// Detects sudden drops in conversion volume at the Account level.
// Good for: Broken tracking pixels, site technical issues, or platform-side outages.
export const accountConversionDropMonitor = new Monitor({
  id: "account_conversion_drop_monitor",
  measureId: adsConversionsMeasure.id,
  enabled: true,
  schedule: "0 11 * * *", // Run daily at 11am
  lookbackDays: 14, // 2 weeks window for comparison
  
  scanConfig: {
    dimensions: ["account_id"], 
    minVolume: 5, // Ignore accounts with < 5 conversions total in the period
  },

  strategy: {
    type: "relative_delta",
    comparison: "previous_period",
    maxDeltaPct: 50, // Alert if conversions drop by more than 50%
  },
  classification: "heuristic",
  impact: {
    type: "performance",
    unit: "conv",
    multiplier: 1
  }
}, adsConversionsMeasure, adsDaily);
