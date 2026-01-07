import { BronzeImport } from "../../base";
import { z } from "zod";

export const facebookAdsAgeGender = new BronzeImport({
  id: "facebookAdsAgeGender",
  description: "Facebook Ads insights broken down by age and gender.",
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
    age: z.string(),
    gender: z.string(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    actions: z
      .array(z.object({ action_type: z.string(), value: z.string() }))
      .optional(),
    actions_video_view: z.number(),
    action_values: z
      .array(z.object({ action_type: z.string(), value: z.string() }))
      .optional(),
  },
});

export const facebookAdsDevice = new BronzeImport({
  id: "facebookAdsDevice",
  description: "Facebook Ads insights broken down by impression device.",
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
    device_platform: z.string(),
    impression_device: z.string(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    actions: z
      .array(z.object({ action_type: z.string(), value: z.string() }))
      .optional(),
    actions_video_view: z.number(),
    action_values: z
      .array(z.object({ action_type: z.string(), value: z.string() }))
      .optional(),
  },
});
