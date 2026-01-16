import { BronzeImport } from "../../base";
import { z } from "zod";

export const facebookAdsCreative = new BronzeImport({
  id: "facebookAdsCreative",
  description: "Facebook Ads creative-level performance with thumbnail URLs and asset IDs.",
  platform: "facebook",
  endpoint: "facebook",
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
    creative_id: z.string(),
    ad_name: z.string(), // Mapped from 'name'
    title: z.string().optional(),
    thumbnail_url: z.string().optional(),
    link_url: z.string().optional(),
    object_type: z.string().optional(),
    url_tags: z.string().optional(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    reach: z.number().optional(),
    frequency: z.number().optional(),
    clicks: z.number(),
    actions_total: z.number(),
    actions_video_view: z.number().optional(),
    action_values: z
      .array(z.object({ action_type: z.string(), value: z.string() }))
      .optional(),
  },
});