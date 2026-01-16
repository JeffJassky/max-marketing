import { Monitor } from "../../../../shared/data/monitor";
import { creativeCTRMeasure } from "../creative.measures";
import { creativeDaily } from "../creative-daily.entity";

/**
 * Detects "Visual Fatigue" by identifying creatives where the CTR has dropped 
 * significantly compared to its own historical average.
 */
export const creativeFatigueMonitor = new Monitor({
  id: "creative_fatigue_monitor",
  measureId: creativeCTRMeasure.id,
  enabled: true,
  schedule: "0 11 * * *", 
  lookbackDays: 7, // Check recent performance
  
  scanConfig: {
    dimensions: ["account_id", "platform", "creative_id", "creative_name"],
    minVolume: 500, // Min impressions in the last 7 days
  },

  strategy: {
    type: "relative_delta",
    comparison: "previous_period",
    maxDeltaPct: 30, // Alert if CTR drops by more than 30% vs previous 7 days
  },

  classification: "heuristic",
  impact: {
    type: "performance",
    unit: "ctr",
    multiplier: 2.0
  },
  
  contextMetrics: ["spend", "impressions", "clicks", "thumbnail_url"]
}, creativeCTRMeasure, creativeDaily);
