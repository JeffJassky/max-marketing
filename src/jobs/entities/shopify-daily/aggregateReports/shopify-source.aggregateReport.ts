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
    grain: ["account_id", "source", "customer_type"],
    metrics: {
      orders: { aggregation: "sum" },
      revenue: { aggregation: "sum" },
      refunds: { aggregation: "sum" },
    },
    derivedFields: {
      aov: {
        expression: "SAFE_DIVIDE(revenue, orders)",
        type: z.number(),
      },
      refund_rate: {
        expression: "SAFE_DIVIDE(refunds, revenue)",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "revenue", direction: "desc" },
});
