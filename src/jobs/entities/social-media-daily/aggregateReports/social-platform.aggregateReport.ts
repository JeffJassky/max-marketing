import { AggregateReport } from "../../../base";
import { socialMediaDaily } from "../social-media-daily.entity";
import { z } from "zod";

export const socialPlatformPerformance = new AggregateReport({
  id: "socialPlatformPerformance",
  description: "Comparative performance breakdown by social platform (Instagram vs Facebook).",
  source: socialMediaDaily,
  predicate: "impressions > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "platform"],
    metrics: {
      impressions: { sourceMetric: "delta_impressions", aggregation: "sum" },
      likes: { sourceMetric: "delta_likes", aggregation: "sum" },
      comments: { sourceMetric: "delta_comments", aggregation: "sum" },
      shares: { sourceMetric: "delta_shares", aggregation: "sum" },
      engagement: { sourceMetric: "delta_engagement", aggregation: "sum" },
    },
    derivedFields: {
      engagement_rate: {
        expression: "SAFE_DIVIDE(engagement, impressions)",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "impressions", direction: "desc" },
});
