import { BronzeImport } from "../../base";
import { z } from "zod";

export const ga4PagePerformance = new BronzeImport({
  id: "ga4PagePerformance",
  description: "GA4 page-level performance data focusing on core metrics to optimize payload size.",
  platform: "googleanalytics4",
  endpoint: "googleanalytics4",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "page_path"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    page_path: z.string(),
    session_default_channel_group: z.string(),
  },
  metrics: {
    bounce_rate: z.number(),
    engaged_sessions: z.number(),
    purchase_revenue: z.number(),
    purchase_to_view_rate: z.number(),
    screen_page_views: z.number(),
    sessions: z.number(),
    conversions: z.number(),
  },
});