import { BronzeImport } from "../../base";
import { z } from "zod";

export const shopifyProducts = new BronzeImport({
  id: "shopifyProducts",
  description: "Shopify product-level performance including units sold and line item revenue.",
  platform: "shopify",
  endpoint: "shopify",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "line_item__product_id"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    order_id: z.string().optional(),
    line_item__product_id: z.string().optional(),
    line_item__name: z.string().optional(),
    line_item__vendor: z.string().optional(),
    product_type: z.string().optional(),
    product_vendor: z.string().optional(),
    product_id: z.string().optional(),
    product_title: z.string().optional(),
  },
  metrics: {
    line_item__quantity: z.number(),
    line_item__price: z.number(),
  },
});