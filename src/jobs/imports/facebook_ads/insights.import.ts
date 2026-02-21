import { BronzeImport } from "../../base";
import { z } from "zod";

export const facebookAdsInsights = new BronzeImport({
  id: "facebookAdsInsights",
  description:
    "Facebook Ads insights data broken down by platform and position for spend analysis.",
  platform: "facebook",
  endpoint: "facebookAdsInsights",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "campaign_id"],
  params: {
    date_preset: "last_90d",
  },
  uniquenessKey: ["date", "account_id", "campaign_id", "adset_id", "publisher_platform", "platform_position"],
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    campaign_id: z.string(),
    campaign_name: z.string(),
    adset_id: z.string(),
    adset_name: z.string(),
    publisher_platform: z.string(),
    platform_position: z.string(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    reach: z.number().optional(),
    frequency: z.number().optional(),
    clicks: z.number(),
    actions: z.array(z.object({ action_type: z.string(), value: z.string() })).optional(),
    action_values: z.array(z.object({ action_type: z.string(), value: z.string() })).optional(), // Often complex structure
  },
});
