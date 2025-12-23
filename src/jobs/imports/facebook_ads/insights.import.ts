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
    clicks: z.number(),
    actions: z.number(), // Total actions (proxy for conversions if not specific)
    action_values: z.array(z.object({ action_type: z.string(), value: z.string() })).optional(), // Often complex structure
  },
});
