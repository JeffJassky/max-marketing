import { BronzeImport } from "../../base";
import { z } from "zod";

export const facebookAdsAdPerformance = new BronzeImport({
  id: "facebookAdsAdPerformance",
  description:
    "Facebook Ads ad-level performance data with campaign, adset, and placement context.",
  platform: "facebook",
  endpoint: "facebookAdsInsights",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "campaign_id", "ad_id"],
  params: {
    date_preset: "last_90d",
  },
  uniquenessKey: ["date", "account_id", "campaign_id", "adset_id", "ad_id", "publisher_platform", "platform_position"],
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    campaign_id: z.string(),
    campaign_name: z.string(),
    adset_id: z.string(),
    adset_name: z.string(),
    ad_id: z.string(),
    ad_name: z.string(),
    publisher_platform: z.string(),
    platform_position: z.string(),
    desktop_feed_standard_preview_url: z.string().optional(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    reach: z.number().optional(),
    clicks: z.number(),
    actions: z.array(z.object({ action_type: z.string(), value: z.string() })).optional(),
    action_values: z.array(z.object({ action_type: z.string(), value: z.string() })).optional(),
  },
});
