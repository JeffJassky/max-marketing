import { AggregateReport } from "../../../base";
import { socialMediaDaily } from "../social-media-daily.entity";
import { z } from "zod";

export const tiktokPostPerformance = new AggregateReport({
  id: "tiktokPostPerformance",
  description: "Detailed organic performance for TikTok videos.",
  source: socialMediaDaily,
  predicate: "platform = 'tiktok' AND (engagement > 0 OR impressions > 0)",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "thumbnail_url", "caption"],
    includeDimensions: ["permalink", "media_type", "published_at"],
    metrics: {
      impressions: { aggregation: "sum", display: { format: "number", description: "Total video views/reach for your TikTok content." } },
      likes: { aggregation: "sum", display: { format: "number", description: "Total likes on your TikTok videos." } },
      comments: { aggregation: "sum", display: { format: "number", description: "Total comments on your TikTok videos." } },
      shares: { aggregation: "sum", display: { format: "number", description: "Total shares of your TikTok videos." } },
      engagement: { aggregation: "sum", display: { format: "number", description: "Total interactions including likes, comments, shares, and favorites." } },
    },
    derivedFields: {
      engagement_rate: {
        expression: "SAFE_DIVIDE(engagement, impressions)",
        type: z.number(),
        display: { format: "percent", description: "Engagement divided by reach. Indicates content resonance." },
      },
    },
  },
  orderBy: { field: "impressions", direction: "desc" },
});
