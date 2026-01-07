import { BronzeImport } from "../../base";
import { z } from "zod";

export const googleAdsGeo = new BronzeImport({
  id: "googleAdsGeo",
  description: "Google Ads performance data broken down by country and state.",
  platform: "google_ads",
  endpoint: "googleAdsGeo",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id"],
  params: {
    date_preset: "last_90d",
    date_aggregation: "month",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    country: z.string(),
    state: z.string(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    conversions: z.number(),
    conversions_value: z.number(),
  },
});