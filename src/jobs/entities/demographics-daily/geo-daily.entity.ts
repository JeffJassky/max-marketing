import { Entity } from "../../base";
import { googleAdsGeo } from "../../imports/google_ads/geo.import";
import { facebookAdsGeo } from "../../imports/facebook_ads/geo.import";
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

export const geoDaily = new Entity({
  id: "geoDaily",
  label: "Geographic Performance",
  description: "Performance data broken down by geographical location.",
  sources: [googleAdsGeo, facebookAdsGeo],
  partitionBy: "date",
  clusterBy: ["platform", "account_id", "country", "region"],
  grain: ["date", "account_id", "country", "region", "city", "platform"],
  dimensions: {
    date: { type: z.string() },
    account_id: { type: z.string() },
    platform: {
      type: z.string(),
      sources: {
        googleAdsGeo: { expression: "'google'" },
        facebookAdsGeo: { expression: "'facebook'" },
      },
    },
    country: {
      type: z.string(),
      sourceField: "country",
      sources: {
        googleAdsGeo: { sourceField: "country" },
        facebookAdsGeo: { sourceField: "country" },
      },
    },
    region: {
      type: z.string(),
      sourceField: "region",
      sources: {
        googleAdsGeo: { sourceField: "state" },
        facebookAdsGeo: { sourceField: "region" },
      },
    },
    city: {
      type: z.string(),
      sources: {
        googleAdsGeo: { expression: "CAST(NULL AS STRING)" },
        facebookAdsGeo: { expression: "CAST(NULL AS STRING)" },
      },
    },
  },
  metrics: {
    spend: { type: z.number(), aggregation: "sum", sourceField: "spend" },
    impressions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "impressions",
    },
    video_views: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "video_views",
      sources: {
        googleAdsGeo: { expression: "0" },
        facebookAdsGeo: {
          expression: "SUM(SAFE_CAST(actions_video_view AS FLOAT64))",
        },
      },
    },

    clicks: { type: z.number(), aggregation: "sum", sourceField: "clicks" },
    conversions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "conversions",
      sources: {
        facebookAdsGeo: {
          expression:
            "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(actions) WHERE action_type = 'purchase'))",
        },
      },
    },
    conversions_value: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "conversions_value",
      sources: {
        facebookAdsGeo: {
          expression:
            "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(action_values) WHERE action_type = 'purchase'))",
        },
      },
    },
  },
  superlatives: [
    {
      dimensionId: "city",
      dimensionLabel: "City",
      limit: 10,
      metrics: [
        { 
          metric: "conversions",
          awards: [VolumeTitanAward, RocketShipAward, ThreeMonthStreakAward] 
        },
        { 
          metric: "roas",
          expression: "CASE WHEN SUM(spend) > 50 THEN SAFE_DIVIDE(SUM(conversions_value), SUM(spend)) ELSE 0 END",
          awards: [EfficiencyKingAward, DominatorAward, PeakPerformerAward]
        },
      ],
    },
    {
      dimensionId: "region",
      dimensionLabel: "Region",
      limit: 5,
      metrics: [
        { metric: "spend", awards: [VolumeTitanAward] },
        { 
          metric: "roas",
          expression: "CASE WHEN SUM(spend) > 100 THEN SAFE_DIVIDE(SUM(conversions_value), SUM(spend)) ELSE 0 END",
          awards: [EfficiencyKingAward]
        },
      ],
    },
  ],
});
