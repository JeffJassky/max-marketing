import { BronzeImport } from "../../base";
import { z } from "zod";

export const ga4Geo = new BronzeImport({
  id: "ga4Geo",
  description: "GA4 performance data broken down by country, region, and city.",
  platform: "googleanalytics4",
  endpoint: "googleanalytics4",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "country", "region"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    country: z.string(),
    region: z.string(),
    city: z.string(),
  },
  metrics: {
    sessions: z.number(),
    screen_page_views: z.number(),
    engaged_sessions: z.number(),
    purchase_revenue: z.number(),
    conversions: z.number(),
  },
});