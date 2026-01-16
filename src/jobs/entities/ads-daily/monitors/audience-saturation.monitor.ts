import { Monitor } from "../../../../shared/data/monitor";
import { adsFrequencyMeasure } from "../ads-daily.measures";
import { adsDaily } from "../ads-daily.entity";

/**
 * Detects Meta Ad Sets where the audience is likely saturated (High Frequency).
 * High frequency combined with low performance is a strong signal to refresh audience or creative.
 */
export const audienceSaturationMonitor = new Monitor({
  id: "audience_saturation_monitor",
  measureId: adsFrequencyMeasure.id,
  enabled: true,
  schedule: "0 10 * * *", // Run daily at 10 AM
  lookbackDays: 14,
  
  scanConfig: {
    dimensions: ["account_id", "platform", "campaign_name", "adset_name"],
    minVolume: 1000, // Min impressions to consider
    filters: [{ field: "platform", op: "=", value: "facebook" }]
  },

  strategy: {
    type: "threshold",
    max: 3.5, 
  },

  classification: "heuristic",
  impact: {
    type: "performance",
    unit: "roas",
    multiplier: 1.5
  },
  
  contextMetrics: ["spend", "impressions", "reach", "conversions_value"]
}, adsFrequencyMeasure, adsDaily);
