import { Entity } from "../../base";
import { googleSearchConsoleAnalytics } from "../../imports/google_search_console/search-analytics.import";
import { z } from "zod";
import {
  RocketShipAward,
  SteadyClimberAward,
  FirstPlaceAward,
  PodiumAward,
  PeakPerformerAward,
  ThreeMonthStreakAward,
  DominatorAward,
  EfficiencyKingAward,
  VolumeTitanAward,
} from "../../../shared/data/awards/library";

/**
 * Google Search Console Daily Entity
 *
 * Silver-layer entity that aggregates search performance data at a daily grain.
 * Supports analysis by query, page, device, country, and branded/non-branded segments.
 */
export const gscDaily = new Entity({
  id: "gscDaily",
  label: "Search Console Performance",
  description: "Daily organic search performance from Google Search Console including queries, pages, clicks, impressions, and rankings.",
  sources: [googleSearchConsoleAnalytics],
  partitionBy: "date",
  clusterBy: ["account_id", "query", "page"],
  grain: ["date", "account_id", "query", "page", "device", "country"],
  dimensions: {
    date: { type: z.string() },
    account_id: { type: z.string() },
    query: { type: z.string(), sourceField: "query" },
    page: { type: z.string(), sourceField: "page" },
    device: { type: z.string(), sourceField: "device" },
    country: { type: z.string(), sourceField: "country" },
    search_type: { type: z.string(), sourceField: "search_type" },
    branded_vs_nonbranded: { type: z.string(), sourceField: "branded_vs_nonbranded" },
    hostname: { type: z.string(), sourceField: "hostname" },
    pagepath: { type: z.string(), sourceField: "pagepath" },
  },
  metrics: {
    clicks: { type: z.number(), aggregation: "sum", sourceField: "clicks" },
    impressions: { type: z.number(), aggregation: "sum", sourceField: "impressions" },
    ctr: {
      type: z.number(),
      aggregation: "avg",
      expression: "SAFE_DIVIDE(SUM(SAFE_CAST(clicks AS FLOAT64)), NULLIF(SUM(SAFE_CAST(impressions AS FLOAT64)), 0))",
    },
    position: {
      type: z.number(),
      aggregation: "avg",
      expression: "AVG(SAFE_CAST(position AS FLOAT64))",
    },
  },
  superlatives: [
    // Top Queries
    {
      dimensionId: "query",
      dimensionLabel: "Query",
      limit: 5,
      metrics: [
        {
          metric: "clicks",
          awards: [VolumeTitanAward, RocketShipAward, FirstPlaceAward, ThreeMonthStreakAward],
        },
        {
          metric: "impressions",
          awards: [VolumeTitanAward, PodiumAward],
        },
        {
          metric: "ctr",
          expression: "CASE WHEN SUM(impressions) > 100 THEN SAFE_DIVIDE(SUM(clicks), SUM(impressions)) ELSE 0 END",
          awards: [EfficiencyKingAward, PeakPerformerAward, DominatorAward],
        },
        {
          metric: "position",
          rank_type: "lowest",
          expression: "CASE WHEN SUM(impressions) > 50 THEN AVG(position) ELSE 999 END",
          awards: [FirstPlaceAward, SteadyClimberAward],
        },
      ],
    },
    // Top Pages
    {
      dimensionId: "page",
      dimensionNameField: "pagepath",
      dimensionLabel: "Page",
      limit: 5,
      metrics: [
        {
          metric: "clicks",
          awards: [VolumeTitanAward, RocketShipAward, FirstPlaceAward],
        },
        {
          metric: "impressions",
          awards: [VolumeTitanAward, PodiumAward],
        },
        {
          metric: "ctr",
          expression: "CASE WHEN SUM(impressions) > 100 THEN SAFE_DIVIDE(SUM(clicks), SUM(impressions)) ELSE 0 END",
          awards: [EfficiencyKingAward, PeakPerformerAward],
        },
      ],
    },
    // Device Performance
    {
      dimensionId: "device",
      dimensionLabel: "Device",
      metrics: [
        { metric: "clicks" },
        { metric: "impressions" },
        {
          metric: "ctr",
          expression: "CASE WHEN SUM(impressions) > 50 THEN SAFE_DIVIDE(SUM(clicks), SUM(impressions)) ELSE 0 END",
          awards: [EfficiencyKingAward],
        },
        {
          metric: "position",
          rank_type: "lowest",
          expression: "CASE WHEN SUM(impressions) > 50 THEN AVG(position) ELSE 999 END",
        },
      ],
    },
    // Branded vs Non-Branded
    {
      dimensionId: "branded_vs_nonbranded",
      dimensionLabel: "Brand Type",
      metrics: [
        { metric: "clicks" },
        { metric: "impressions" },
        {
          metric: "ctr",
          expression: "CASE WHEN SUM(impressions) > 50 THEN SAFE_DIVIDE(SUM(clicks), SUM(impressions)) ELSE 0 END",
        },
      ],
    },
  ],
});
