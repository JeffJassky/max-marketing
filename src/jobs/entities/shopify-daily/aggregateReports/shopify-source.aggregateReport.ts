import { AggregateReport } from "../../../base";
import { shopifyDaily } from "../shopify-daily.entity";
import { z } from "zod";

export const shopifySourcePerformance = new AggregateReport({
  id: "shopifySourcePerformance",
  description: "Sales breakdown by origin/channel for Shopify.",
  source: shopifyDaily,
  predicate: "revenue > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "customer_type"],
    metrics: {
      orders: { aggregation: "sum", display: { format: "number", description: "Total number of completed orders. Direct measure of purchase volume." } },
      revenue: { aggregation: "sum", display: { format: "currency", description: "Total gross sales from your Shopify store. The source of truth for actual business revenue." } },
      refunds: { aggregation: "sum", display: { format: "currency", description: "Total refund amounts processed. Monitor for potential product or service issues." } },
    },
    derivedFields: {
      aov: {
        expression: "SAFE_DIVIDE(revenue, orders)",
        type: z.number(),
        display: { format: "currency", description: "Average Order Value. Revenue divided by orders. Higher AOV often indicates successful upselling." },
      },
      refund_rate: {
        expression: "SAFE_DIVIDE(refunds, revenue)",
        type: z.number(),
        display: { format: "percent", description: "Percentage of revenue returned as refunds. Monitor for quality issues or customer dissatisfaction trends." },
      },
    },
  },
  orderBy: { field: "revenue", direction: "desc" },
});
