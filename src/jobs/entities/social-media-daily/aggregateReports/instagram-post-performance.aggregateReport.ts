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
      impressions: { aggregation: "sum", display: { format: "number", description: "Total times your organic posts were displayed to users across social platforms." } },
      likes: { aggregation: "sum", display: { format: "number", description: "Total likes on your posts. A basic engagement indicator showing content appreciation." } },
      comments: { aggregation: "sum", display: { format: "number", description: "Total comments on your posts. Indicates deeper engagement and conversation around your content." } },
      shares: { aggregation: "sum", display: { format: "number", description: "Total times your content was shared. Shows high-value engagement as users amplify your message." } },
      engagement: { aggregation: "sum", display: { format: "number", description: "Total interactions including likes, comments, shares, and saves. Aggregate engagement metric." } },
    },
    derivedFields: {
      engagement_rate: {
        expression: "SAFE_DIVIDE(engagement, impressions)",
        type: z.number(),
        display: { format: "percent", description: "Engagement divided by reach. Indicates how compelling your content is to your audience." },
      },
    },
  },
  orderBy: { field: "impressions", direction: "desc" },
});
