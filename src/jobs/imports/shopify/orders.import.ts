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
  uniquenessKey: ["date", "account_id", "order_id"],
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    order_id: z.string(),
    customer_id: z.string().optional(),
    customer_email: z.string().optional(),
    source: z.string(),
    customer_is_returning: z.string().optional(),
    customer_orders_count: z.number().optional(),
    order_shipping_address_city: z.string().optional(),
    order_shipping_address_province: z.string().optional(),
    order_shipping_address_country: z.string().optional(),
  },
  metrics: {
    order_current_total_tax: z.number(),
    order_refunds_subtotal: z.number(),
    order_subtotal_price: z.number(),
    order_total_capturable_amount: z.number(),
    order_total_count: z.number(),
    order_total_discounts: z.number(),
    order_total_price: z.number(),
    order_customer_number_of_orders: z.number().optional(),
  },
});
