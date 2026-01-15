import { Entity } from "../../base";
import { ga4PagePerformance } from "../../imports/google_ga4/page-performance.import";
import { z } from "zod";
import {
  VolumeTitanAward,
  RocketShipAward,
  FirstPlaceAward,
  PodiumAward,
  EfficiencyKingAward,
} from "../../../shared/data/awards/library";

export const ga4Daily = new Entity({
  id: "ga4Daily",
  label: "GA4 Performance",
  description:
    "Unified daily performance for GA4 focusing on page performance and core engagement metrics.",
  sources: [ga4PagePerformance],
  partitionBy: "date",
  clusterBy: ["account_id", "channel_group", "page_path"],
  grain: ["date", "account_id", "channel_group", "page_path"],
  dimensions: {
    date: { type: z.string() },
    account_id: { type: z.string() },
    account_name: { type: z.string() },
    page_path: { type: z.string() },
    channel_group: { type: z.string(), sourceField: "session_default_channel_group" },
  },
  metrics: {
    views: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "screen_page_views",
    },
    sessions: { type: z.number(), aggregation: "sum", sourceField: "sessions" },
    engaged_sessions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "engaged_sessions",
    },
    revenue: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "purchase_revenue",
    },
  },
  superlatives: [
    {
      dimensionId: "page_path",
      dimensionLabel: "Page",
      limit: 10,
      metrics: [
        { metric: "views", awards: [VolumeTitanAward, FirstPlaceAward] },
        { metric: "sessions" },
        {
          metric: "organic_revenue",
          expression: "SUM(CASE WHEN channel_group = 'Organic Search' THEN revenue ELSE 0 END)",
          awards: [VolumeTitanAward, FirstPlaceAward],
        },
      ],
    },
  ],
});
