import { AggregateReport } from "../../../base";
import { ga4Daily } from "../ga4-daily.entity";
import { z } from "zod";

export const ga4AcquisitionPerformance = new AggregateReport({
  id: "ga4AcquisitionPerformance",
  description: "Traffic source and acquisition quality rollup for GA4.",
  source: ga4Daily,
  predicate: "sessions > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "channel_group"],
    metrics: {
      sessions: { aggregation: "sum" },
      engaged_sessions: { aggregation: "sum" },
      conversions: { aggregation: "sum" },
      revenue: { aggregation: "sum" },
    },
    derivedFields: {
      engagement_rate: {
        expression: "SAFE_DIVIDE(engaged_sessions, sessions)",
        type: z.number(),
      },
      conversion_rate: {
        expression: "SAFE_DIVIDE(conversions, sessions)",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "sessions", direction: "desc" },
});
