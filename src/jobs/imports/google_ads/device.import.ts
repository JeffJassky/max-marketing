import { BronzeImport } from "../../base";
import { z } from "zod";

export const googleAdsDevice = new BronzeImport({
  id: "googleAdsDevice",
  description: "Google Ads performance data broken down by device.",
  platform: "google_ads",
  endpoint: "googleAdsDemographics",
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
    device: z.string(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    conversions: z.number(),
    conversions_value: z.number(),
  },
});
