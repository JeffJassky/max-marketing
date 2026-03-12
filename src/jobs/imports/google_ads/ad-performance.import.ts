import { BronzeImport } from "../../base";
import { z } from "zod";

export const googleAdsAdPerformance = new BronzeImport({
  id: "googleAdsAdPerformance",
  description:
    "Google Ads ad-level performance data with campaign and ad group context.",
  platform: "google_ads",
  endpoint: "googleAdsAdPerformance",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "campaign_id", "ad_id"],
  params: {
    date_preset: "last_90d",
  },
  uniquenessKey: ["date", "account_id", "campaign_id", "ad_group_id", "ad_id"],
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    campaign: z.string(),
    campaign_id: z.string(),
    ad_group: z.string(),
    ad_group_id: z.string(),
    ad_id: z.string(),
    ad_name: z.string(),
    advertising_channel_type: z.string(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    conversions: z.number(),
    conversions_value: z.number(),
    video_views: z.number(),
  },
});
