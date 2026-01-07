import { Measure } from "../../../shared/data/types";
import { ga4Daily } from "./ga4-daily.entity";

export const ga4SessionsMeasure: Measure = {
  id: "ga4_sessions_daily",
  entityId: ga4Daily.id,
  name: "Daily GA4 Sessions",
  description: "Total sessions reported by GA4.",
  value: { field: "sessions", aggregation: "sum" },
  allowedDimensions: ["account_id", "page_path", "date"],
};

export const ga4ViewsMeasure: Measure = {
  id: "ga4_views_daily",
  entityId: ga4Daily.id,
  name: "Daily GA4 Views",
  description: "Total page views reported by GA4.",
  value: { field: "views", aggregation: "sum" },
  allowedDimensions: ["account_id", "page_path", "date"],
};

export const ga4RevenueMeasure: Measure = {
  id: "ga4_revenue_daily",
  entityId: ga4Daily.id,
  name: "Daily GA4 Revenue",
  description: "Total revenue reported by GA4.",
  value: { field: "revenue", aggregation: "sum" },
  allowedDimensions: ["account_id", "page_path", "date"],
};