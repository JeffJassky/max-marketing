import { BronzeImport } from "../../base";
import { z } from "zod";

export const ga4Age = new BronzeImport({
  id: "ga4Age",
  description: "GA4 performance data broken down by age bracket.",
  platform: "googleanalytics4",
  endpoint: "googleanalytics4",
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
    age: z.string(),
  },
  metrics: {
    sessions: z.number(),
    screen_page_views: z.number(),
    engaged_sessions: z.number(),
    purchase_revenue: z.number(),
    conversions: z.number(),
  },
});

export const ga4Gender = new BronzeImport({
  id: "ga4Gender",
  description: "GA4 performance data broken down by gender.",
  platform: "googleanalytics4",
  endpoint: "googleanalytics4",
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
    gender: z.string(),
  },
  metrics: {
    sessions: z.number(),
    screen_page_views: z.number(),
    engaged_sessions: z.number(),
    purchase_revenue: z.number(),
    conversions: z.number(),
  },
});