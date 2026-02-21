import { AggregateReport } from "../../../base";
import { socialMediaDaily } from "../social-media-daily.entity";
import { z } from "zod";

export const instagramPostPerformance = new AggregateReport({
  id: "instagramPostPerformance",
  description: "Detailed organic performance for Instagram posts.",
  source: socialMediaDaily,
  predicate: "platform = 'instagram' AND (engagement > 0 OR impressions > 0)",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "thumbnail_url", "caption"],
    includeDimensions: ["permalink", "media_type"],
    metrics: {
      impressions: { aggregation: "sum" },
      likes: { aggregation: "sum" },
      comments: { aggregation: "sum" },
      shares: { aggregation: "sum" },
      engagement: { aggregation: "sum" },
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
