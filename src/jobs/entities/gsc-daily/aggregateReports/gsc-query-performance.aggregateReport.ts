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
      clicks: { aggregation: "sum", display: { format: "number", description: "Total organic traffic. This is the volume of visitors coming to your site for free from Google search results." } },
      impressions: { aggregation: "sum", display: { format: "number", description: "Organic visibility. This measures how often Google shows your brand to people searching for related keywords." } },
      position: { aggregation: "avg", display: { format: "number", description: "Search rank. This is your average 'seat' on the Google results page. The closer this number is to 1, the higher you appear at the top of the page." } },
    },
    derivedFields: {
      ctr: {
        expression: "SAFE_DIVIDE(clicks, impressions)",
        type: z.number(),
        display: { format: "percent", description: "Search relevance. A higher CTR means your website's title and description are highly relevant to what people are searching for." },
      },
    },
  },
  orderBy: { field: "clicks", direction: "desc" },
});
