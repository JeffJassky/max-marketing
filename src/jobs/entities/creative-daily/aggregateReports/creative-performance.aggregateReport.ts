import { AggregateReport } from "../../../base";
import { creativeDaily } from "../creative-daily.entity";
import { z } from "zod";

export const creativePerformanceReport = new AggregateReport({
  id: "creativePerformanceReport",
  description: "Aggregated performance of ad creatives across Google and Meta.",
  source: creativeDaily,
  predicate: "spend > 0 OR impressions > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "platform", "creative_id"],
    includeDimensions: ["creative_name", "title", "thumbnail_url"],
    metrics: {
      spend: { aggregation: "sum" },
      impressions: { aggregation: "sum" },
      clicks: { aggregation: "sum" },
      conversions: { aggregation: "sum" },
      revenue: { aggregation: "sum" },
      video_views: { aggregation: "sum" },
    },
    derivedFields: {
      roas: {
        expression: "SAFE_DIVIDE(revenue, spend)",
        type: z.number(),
      },
      ctr: {
        expression: "SAFE_DIVIDE(clicks, impressions)",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "spend", direction: "desc" },
});
