import { BronzeImport } from "../../base";
import { z } from "zod";

export const shopifyOrders = new BronzeImport({
  id: "shopifyOrders",
  description: "Shopify orders data including revenue, tax, shipping, and discounts.",
  platform: "shopify",
  endpoint: "shopify",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    order_id: z.string(),
    source: z.string(),
    order_shipping_address_city: z.string(),
    order_shipping_address_province: z.string(),
    order_shipping_address_country: z.string(),
  },
  metrics: {
    order_current_total_tax: z.number(),
    order_refunds_subtotal: z.number(),
    order_subtotal_price: z.number(),
    order_total_capturable_amount: z.number(),
    order_total_count: z.number(),
    order_total_discounts: z.number(),
    order_total_price: z.number(),
  },
});
