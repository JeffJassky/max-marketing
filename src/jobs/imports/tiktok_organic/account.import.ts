import { BronzeImport } from "../../base";
import { z } from "zod";

export const tiktokOrganicAccount = new BronzeImport({
  id: "tiktokOrganicAccount",
  description: "TikTok account-level metrics including followers (snapshot), daily gains/losses, and reach.",
  platform: "tiktok_organic",
  endpoint: "tiktok_organic",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id"],
  uniquenessKey: ["date", "account_id"],
  params: {
    date_preset: "last_30d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string().optional(),
  },
  metrics: {
    total_followers_count: z.number(),
    followers_count: z.number(),
    daily_lost_followers: z.number(),
    profile_views: z.number(),
    engaged_audience: z.number(),
    unique_video_views: z.number(),
  },
});
