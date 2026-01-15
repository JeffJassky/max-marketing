import { BronzeImport } from "../../base";
import { z } from "zod";

export const googleAdsCreative = new BronzeImport({
  id: "googleAdsCreative",
  description: "Google Ads creative (ad) performance with asset metadata.",
  platform: "google_ads",
  endpoint: "googleAdsAdPerformance",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "creative_id"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    campaign: z.string(),
    campaign_id: z.string(),
    creative_id: z.string(),
    name: z.string().optional(),
    title: z.string().optional(),
    ad_type: z.string().optional(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    conversions: z.number(),
    conversions_value: z.number(),
    video_views: z.number().optional(),
  },
});