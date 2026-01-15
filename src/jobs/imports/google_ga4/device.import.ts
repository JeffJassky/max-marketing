import { BronzeImport } from "../../base";
import { z } from "zod";

export const ga4Device = new BronzeImport({
  id: "ga4Device",
  description: "GA4 performance data broken down by device category.",
  platform: "googleanalytics4",
  endpoint: "googleanalytics4",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "device"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    device: z.string(),
  },
  metrics: {
    sessions: z.number(),
    screen_page_views: z.number(),
    engaged_sessions: z.number(),
    purchase_revenue: z.number(),
    conversions: z.number(),
  },
});
