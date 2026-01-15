import { AggregateReport } from "../../../base";
import { shopifyDaily } from "../shopify-daily.entity";
import { z } from "zod";

export const shopifyGeoBreakdown = new AggregateReport({
  id: "shopifyGeoBreakdown",
  description: "Shopify revenue breakdown by city and country.",
  source: shopifyDaily,
  predicate: "revenue > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "country", "region", "city"],
    metrics: {
      revenue: { aggregation: "sum" },
      orders: { aggregation: "sum" },
      tax: { aggregation: "sum" },
      discounts: { aggregation: "sum" },
      refunds: { aggregation: "sum" },
    },
    derivedFields: {
      aov: {
        expression: "SAFE_DIVIDE(revenue, orders)",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "revenue", direction: "desc" },
});
