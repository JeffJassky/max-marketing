import { AggregateReport } from "../../../base";
import { ga4Daily } from "../ga4-daily.entity";
import { z } from "zod";

export const ga4PagePerformanceBreakdown = new AggregateReport({
  id: "ga4PagePerformanceBreakdown",
  description: "GA4 page-level performance breakdown.",
  source: ga4Daily,
  predicate: "views > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "page_path"],
    metrics: {
      views: { aggregation: "sum" },
      sessions: { aggregation: "sum" },
      engaged_sessions: { aggregation: "sum" },
      revenue: { aggregation: "sum" },
    },
    derivedFields: {
      engagement_rate: {
        expression: "SAFE_DIVIDE(engaged_sessions, sessions)",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "views", direction: "desc" },
});