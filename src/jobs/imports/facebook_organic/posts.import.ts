import { BronzeImport } from "../../base";
import { z } from "zod";

const today = () => new Date().toISOString().split("T")[0];

export const facebookOrganicPosts = new BronzeImport({
  id: "facebookOrganicPosts",
  description: "Facebook organic post performance including impressions, views, and engagement.",
  platform: "facebook_organic",
  endpoint: "facebook_organic",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "post_id"],
  uniquenessKey: ["date", "account_id", "post_id"],
  params: {
    date_preset: "last_90d",
  },
  transformRows: (rows) =>
    rows.map((row) => ({
      ...row,
      published_date: row.date || null,
      date: today(),
    })),
  derivedFields: {
    published_date: z.string().optional(),
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    post_id: z.string(),
    post_title: z.string().optional(),
    post_message: z.string().optional(),
    post_description: z.string().optional(),
    post_picture: z.string().optional(),
    full_picture: z.string().optional(),
    post_created_time: z.string().optional(),
  },
  metrics: {
    post_impressions: z.number(),
    post_video_views: z.number(),
    post_activity_by_action_type_like: z.number(),
    post_comments_total: z.number(),
    clicks: z.number(),
    page_post_engagements: z.number(),
  },
});
