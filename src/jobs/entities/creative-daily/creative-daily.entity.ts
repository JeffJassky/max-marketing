import { Entity } from "../../base";
import { facebookAdsCreative } from "../../imports/facebook_ads/creative.import";
import { googleAdsCreative } from "../../imports/google_ads/creative.import";
import { z } from "zod";
import {
  VolumeTitanAward,
  FirstPlaceAward,
  EfficiencyKingAward,
  RocketShipAward,
} from "../../../shared/data/awards/library";

export const creativeDaily = new Entity({
  id: "creativeDaily",
  label: "Creative Performance",
  description: "Unified creative-level performance across Meta and Google Ads.",
  sources: [facebookAdsCreative, googleAdsCreative],
  partitionBy: "date",
  clusterBy: ["platform", "account_id", "creative_id"],
  grain: ["date", "account_id", "platform", "creative_id"],
  dimensions: {
    date: { type: z.string() },
    account_id: { type: z.string() },
    platform: {
      type: z.string(),
      sources: {
        facebookAdsCreative: { expression: "'facebook'" },
        googleAdsCreative: { expression: "'google'" },
      },
    },
    creative_id: {
      type: z.string(),
      sources: {
        facebookAdsCreative: { sourceField: "creative_id" },
        googleAdsCreative: { sourceField: "creative_id" },
      },
    },
    creative_name: {
      type: z.string(),
      sources: {
        facebookAdsCreative: { sourceField: "ad_name" },
        googleAdsCreative: { sourceField: "name" },
      },
    },
    title: {
      type: z.string(),
      sources: {
        facebookAdsCreative: { sourceField: "title" },
        googleAdsCreative: { sourceField: "title" },
      },
    },
    thumbnail_url: {
      type: z.string(),
      sources: {
        facebookAdsCreative: { sourceField: "thumbnail_url" },
        googleAdsCreative: { expression: "CAST(NULL AS STRING)" },
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
    reach: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "reach",
      sources: {
        googleAdsCreative: { expression: "0" },
      },
    },
    clicks: { type: z.number(), aggregation: "sum", sourceField: "clicks" },
    video_views: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "video_views",
      sources: {
        facebookAdsCreative: { sourceField: "actions_video_view" },
        googleAdsCreative: { sourceField: "video_views" },
      },
    },
    conversions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "conversions",
      sources: {
        facebookAdsCreative: {
          expression:
            "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(action_values) WHERE action_type = 'purchase'))",
        },
      },
    },
    revenue: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "conversions_value",
      sources: {
        facebookAdsCreative: {
          expression:
            "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(action_values) WHERE action_type = 'purchase'))",
        },
      },
    },
    engagement: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        facebookAdsCreative: { sourceField: "actions_total" },
        googleAdsCreative: { sourceField: "clicks" },
      },
    },
  },
  superlatives: [
    {
      dimensionId: "creative_id",
      dimensionNameField: "creative_name",
      dimensionLabel: "Creative",
      includeDimensions: ["thumbnail_url"],
      limit: 10,
      metrics: [
        {
          metric: "thumb_stopper_score",
          expression: "CASE WHEN SUM(impressions) > 1000 THEN SAFE_DIVIDE(SUM(clicks), SUM(impressions)) ELSE 0 END",
          awards: [FirstPlaceAward, RocketShipAward],
        },
        { metric: "video_views", awards: [VolumeTitanAward] },
        { metric: "spend", awards: [VolumeTitanAward] },
        {
          metric: "roas",
          expression: "CASE WHEN SUM(spend) > 50 THEN SAFE_DIVIDE(SUM(revenue), SUM(spend)) ELSE 0 END",
          awards: [EfficiencyKingAward],
        },
      ],
    },
  ],
});
