import { AggregateReport } from "../../../base";
import { shopifyProductDaily } from "../shopify-product-daily.entity";
import { z } from "zod";

export const shopifyProductPerformance = new AggregateReport({
  id: "shopifyProductPerformance",
  description: "Shopify product, vendor, and category performance breakdown.",
  source: shopifyProductDaily,
  predicate: "revenue > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "product_vendor", "product_type", "product_title"],
    metrics: {
      revenue: { aggregation: "sum" },
      units_sold: { aggregation: "sum" },
      orders: { aggregation: "sum" },
    },
    derivedFields: {
      avg_unit_price: {
        expression: "SAFE_DIVIDE(revenue, units_sold)",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "revenue", direction: "desc" },
});
