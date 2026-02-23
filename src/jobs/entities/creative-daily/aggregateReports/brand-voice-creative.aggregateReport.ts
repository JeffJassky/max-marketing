import { AggregateReport } from "../../../base";
import { creativeDaily } from "../creative-daily.entity";
import { z } from "zod";

export const brandVoiceCreativePerformance = new AggregateReport({
  id: "brandVoiceCreativePerformance",
  description: "Creative performance report focused on copy and headlines for brand voice analysis.",
  source: creativeDaily,
  predicate: "impressions > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "creative_id", "title"],
    includeDimensions: ["creative_name", "thumbnail_url", "platform"],
    metrics: {
      spend: { aggregation: "sum" },
      impressions: { aggregation: "sum" },
      clicks: { aggregation: "sum" },
      revenue: { aggregation: "sum" },
      engagement: { aggregation: "sum" },
    },
    derivedFields: {
      engagement_rate: {
        expression: "SAFE_DIVIDE(engagement, impressions)",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "engagement", direction: "desc" },
});
