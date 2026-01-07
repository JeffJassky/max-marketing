import { BronzeImport } from "../../base";
import { z } from "zod";

export const facebookAdsGeo = new BronzeImport({
  id: "facebookAdsGeo",
  description: "Facebook Ads insights broken down by country and region.",
  platform: "facebook",
  endpoint: "facebookAdsInsights",
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
    campaign_id: z.string(),
    campaign_name: z.string(),
    country: z.string(),
    region: z.string(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    actions: z.array(z.object({ action_type: z.string(), value: z.string() })).optional(),
    actions_video_view: z.number(),
    action_values: z.array(z.object({ action_type: z.string(), value: z.string() })).optional(),
  },
});