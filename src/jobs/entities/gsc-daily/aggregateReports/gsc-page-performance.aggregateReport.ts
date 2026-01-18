import { AggregateReport } from "../../../base";
import { gscDaily } from "../gsc-daily.entity";
import { z } from "zod";

/**
 * GSC Page Performance Report
 *
 * Aggregates search performance by page URL to identify top-ranking
 * pages and content performance opportunities.
 */
export const gscPagePerformance = new AggregateReport({
  id: "gscPagePerformance",
  description: "Top performing pages from Google Search Console - pages driving the most organic traffic.",
  source: gscDaily,
  predicate: "clicks > 0", // Only show pages that actually drove traffic
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "page"],
    includeDimensions: ["pagepath", "hostname"],
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
