import { Monitor } from "../../../../shared/data/monitor";
import { ga4RevenueMeasure } from "../ga4-daily.measures";
import { ga4Daily } from "../ga4-daily.entity";

// Using Revenue as the primary conversion proxy for GA4 monitoring
export const ga4ConversionDropMonitor = new Monitor({
  id: "ga4_conversion_drop_monitor",
  measureId: ga4RevenueMeasure.id,
  enabled: true,
  schedule: "0 12 * * *", // Run daily at noon
  lookbackDays: 14,
  
  scanConfig: {
    dimensions: ["account_id"], 
    minVolume: 10, // Minimum revenue threshold
  },

  strategy: {
    type: "relative_delta",
    comparison: "previous_period",
    maxDeltaPct: 50,
  },
  classification: "heuristic",
  impact: {
    type: "performance",
    unit: "$",
    multiplier: 1
  }
}, ga4RevenueMeasure, ga4Daily);