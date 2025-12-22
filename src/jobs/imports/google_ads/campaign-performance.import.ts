import { BronzeImport } from "../../base";
import { z } from "zod";

export const googleAdsCampaignPerformance = new BronzeImport({
  id: "campaignPerformance",
  description:
    "Campaign-level performance data including channel type, used for high-level PMax analysis.",
  platform: "google_ads",
  endpoint: "googleAdsCampaignPerformance",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "campaign_id"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    campaign: z.string(),
    campaign_id: z.string(),
    advertising_channel_type: z.string(),
    advertising_channel_sub_type: z.string(),
    ad_network_type: z.string(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    conversions: z.number(),
    conversions_value: z.number(),
    video_views: z.number(),
    active_view_impressions: z.number(),
  },
});
