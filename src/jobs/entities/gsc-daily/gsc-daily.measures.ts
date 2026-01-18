import { Measure } from "../../../shared/data/types";
import { gscDaily } from "./gsc-daily.entity";

/**
 * GSC Clicks Measure
 * Total clicks from organic search results.
 */
export const gscClicksMeasure: Measure = {
  id: "gsc_clicks_daily",
  entityId: gscDaily.id,
  name: "Daily Organic Clicks",
  description: "Total clicks from Google Search results.",
  value: {
    field: "clicks",
    aggregation: "sum",
  },
  allowedDimensions: ["account_id", "query", "page", "device", "country", "date"],
};

/**
 * GSC Impressions Measure
 * Total impressions (search result appearances).
 */
export const gscImpressionsMeasure: Measure = {
  id: "gsc_impressions_daily",
  entityId: gscDaily.id,
  name: "Daily Organic Impressions",
  description: "Total impressions from Google Search results.",
  value: {
    field: "impressions",
    aggregation: "sum",
  },
  allowedDimensions: ["account_id", "query", "page", "device", "country", "date"],
};

/**
 * GSC Average Position Measure
 * Average ranking position in search results.
 */
export const gscPositionMeasure: Measure = {
  id: "gsc_position_daily",
  entityId: gscDaily.id,
  name: "Average Search Position",
  description: "Average ranking position in Google Search results (lower is better).",
  value: {
    field: "position",
    aggregation: "avg",
  },
  allowedDimensions: ["account_id", "query", "page", "device", "country", "date"],
};

/**
 * GSC CTR Measure
 * Click-through rate from search results.
 */
export const gscCTRMeasure: Measure = {
  id: "gsc_ctr_daily",
  entityId: gscDaily.id,
  name: "Organic CTR",
  description: "Click-through rate from Google Search results.",
  value: {
    expression: "SAFE_DIVIDE(SUM(clicks), SUM(impressions))",
  },
  allowedDimensions: ["account_id", "query", "page", "device", "country", "date"],
};
