import { Monitor } from "../../../../shared/data/monitor";
import { shopifyRevenueMeasure } from "../shopify.measures";
import { shopifyDaily } from "../shopify-daily.entity";

// Detects sudden drops in revenue at the Account level.
export const shopifyRevenueDropMonitor = new Monitor({
  id: "shopify_revenue_drop_monitor",
  measureId: shopifyRevenueMeasure.id,
  enabled: true,
  schedule: "0 12 * * *", // Run daily at noon
  lookbackDays: 14,
  
  scanConfig: {
    dimensions: ["account_id"], 
    minVolume: 100, // Ignore accounts with < $100 revenue in period
  },

  strategy: {
    type: "relative_delta",
    comparison: "previous_period",
    maxDeltaPct: 50, // Alert if revenue drops by > 50% vs previous period
  },
  classification: "heuristic",
  impact: {
    type: "financial",
    unit: "$",
    multiplier: 1
  },
  contextMetrics: ["orders", "tax", "discounts", "refunds"]
}, shopifyRevenueMeasure, shopifyDaily);
