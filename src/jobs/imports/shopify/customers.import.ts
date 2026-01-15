import { BronzeImport } from "../../base";
import { z } from "zod";

export const shopifyCustomers = new BronzeImport({
  id: "shopifyCustomers",
  description: "Shopify customer-level metrics.",
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
    customer_id: z.string(),
  },
  metrics: {
    customer_orders_count: z.number(),
    customer_total_spent: z.number(),
  },
});
