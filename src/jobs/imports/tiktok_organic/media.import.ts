import { BronzeImport } from "../../base";
import { z } from "zod";

export const tiktokOrganicMedia = new BronzeImport({
  id: "tiktokOrganicMedia",
  description: "TikTok organic video performance including views, reach, and engagement.",
  platform: "tiktok_organic",
  endpoint: "tiktok_organic",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "video_id"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string().optional(),
    video_id: z.string(),
    video_caption: z.string().optional(),
    video_share_url: z.string().optional(),
    video_thumbnail_url: z.string().optional(),
    video_create_datetime: z.string().optional(),
    video_duration: z.number().optional(),
  },
  metrics: {
    video_views_count: z.number(),
    video_likes: z.number(),
    video_comments: z.number(),
    video_shares: z.number(),
    video_reach: z.number(),
    video_favorites: z.number(),
  },
});
