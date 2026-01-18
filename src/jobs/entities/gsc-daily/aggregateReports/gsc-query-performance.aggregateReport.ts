import { AggregateReport } from "../../../base";
import { gscDaily } from "../gsc-daily.entity";
import { z } from "zod";

/**
 * GSC Query Performance Report
 *
 * Aggregates search performance by query to identify top-performing
 * and opportunity keywords in organic search.
 */
export const gscQueryPerformance = new AggregateReport({
  id: "gscQueryPerformance",
  description: "Top performing search queries from Google Search Console - queries driving the most organic traffic.",
  source: gscDaily,
  predicate: "clicks > 0", // Only show queries that actually drove traffic
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "query"],
    includeDimensions: ["branded_vs_nonbranded"],
    metrics: {
      clicks: { aggregation: "sum" },
      impressions: { aggregation: "sum" },
      position: { aggregation: "avg" },
    },
    derivedFields: {
      ctr: {
        expression: "SAFE_DIVIDE(clicks, impressions)",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "clicks", direction: "desc" },
});
