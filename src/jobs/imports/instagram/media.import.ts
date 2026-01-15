import { BronzeImport } from "../../base";
import { z } from "zod";

export const instagramMedia = new BronzeImport({
  id: "instagramMedia",
  description: "Instagram organic media performance including engagement, reach, and views.",
  platform: "instagram",
  endpoint: "instagram",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "media_id"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    media_id: z.string(),
    media_caption: z.string().optional(),
    media_permalink: z.string().optional(),
    media_thumbnail_url: z.string().optional(),
    media_type: z.string().optional(),
    media_shortcode: z.string().optional(),
    name: z.string().optional(),
  },
  metrics: {
    media_engagement: z.number(),
    media_like_count: z.number(),
    media_comments_count: z.number(),
    media_reach: z.number(),
    media_saved: z.number(),
    media_shares: z.number(),
    media_views: z.number(),
    impressions: z.number(),
  },
});
