import { Monitor } from "../../../../shared/data/monitor";
import { campaignSpendMeasure } from "../campaign-daily.measures";
import { campaignDaily } from "../campaign-daily.entity";

// Detects statistical outliers in spend at the Account level.
// Good for: Runaway budgets, broken credit cards (zero spend), or seasonal spikes.
export const accountSpendAnomalyMonitor = new Monitor({
  id: "account_spend_anomaly_monitor",
  measureId: campaignSpendMeasure.id,
  enabled: true,
  schedule: "0 10 * * *", // Run daily at 10am
  lookbackDays: 30, // 30 days history for statistical baseline
  
  scanConfig: {
    dimensions: ["account_id"], // Check each account individually
    minVolume: 10, // Ignore accounts spending < $10 total in the period
  },

  strategy: {
    type: "z_score",
    threshold: 3, // 3 Standard Deviations (approx 99.7% confidence)
    minDataPoints: 14, // Need at least 2 weeks of data to establish a pattern
  },
  classification: "statistical",
  impact: {
    type: "financial",
    unit: "$",
    multiplier: 1
  }
}, campaignSpendMeasure, campaignDaily);
