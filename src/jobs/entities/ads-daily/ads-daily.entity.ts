import { Entity } from "../../base";
import { googleAdsAdPerformance } from "../../imports/google_ads/ad-performance.import";
import { facebookAdsAdPerformance } from "../../imports/facebook_ads/ad-performance.import";
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
  HighRollerAward,
} from "../../../shared/data/awards/library";
import { AwardDefinition } from "../../../shared/data/types";

export const adsDaily = new Entity({
  id: "adsDaily",
  label: "Ads Performance",
  description: "Unified daily ad-level performance across Google and Meta Ads.",
  sources: [googleAdsAdPerformance, facebookAdsAdPerformance],
  partitionBy: "date",
  clusterBy: ["platform", "account_id", "campaign_id", "ad_id"],
  grain: ["date", "account_id", "campaign_id", "adset_id", "ad_id", "platform"],
  dimensions: {
    date: { type: z.string() },
    account_id: { type: z.string() },
    platform: {
      type: z.string(),
      sources: {
        googleAdsAdPerformance: { expression: "'google'" },
        facebookAdsAdPerformance: { expression: "'facebook'" },
      },
    },
    campaign_id: { type: z.string() },
    campaign_name: {
      type: z.string(),
      sourceField: "campaign_name",
      sources: {
        googleAdsAdPerformance: { sourceField: "campaign" },
      },
    },
    adset_id: {
      type: z.string(),
      sources: {
        googleAdsAdPerformance: { sourceField: "ad_group_id" },
        facebookAdsAdPerformance: { sourceField: "adset_id" },
      },
    },
    adset_name: {
      type: z.string(),
      sources: {
        googleAdsAdPerformance: { sourceField: "ad_group" },
        facebookAdsAdPerformance: { sourceField: "adset_name" },
      },
    },
    ad_id: {
      type: z.string(),
      sourceField: "ad_id",
    },
    ad_name: {
      type: z.string(),
      sourceField: "ad_name",
    },
    ad_preview_url: {
      type: z.string(),
      sources: {
        facebookAdsAdPerformance: { sourceField: "desktop_feed_standard_preview_url" },
        googleAdsAdPerformance: { expression: "CAST(NULL AS STRING)" },
      },
    },
    channel_group: {
      type: z.string(),
      sourceField: "publisher_platform",
      sources: {
        googleAdsAdPerformance: { sourceField: "advertising_channel_type" },
        facebookAdsAdPerformance: {
          expression: `
            CASE
              WHEN platform_position LIKE '%story%' THEN 'Stories'
              WHEN platform_position LIKE '%reels%' THEN 'Reels'
              WHEN platform_position LIKE '%feed%' THEN 'Feed'
              WHEN platform_position LIKE '%marketplace%' THEN 'Marketplace'
              WHEN publisher_platform = 'audience_network' THEN 'Audience Network'
              ELSE 'Other Meta'
            END
          `,
        },
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
        googleAdsAdPerformance: { expression: "0" },
      },
    },
    video_views: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "video_views",
      sources: {
        facebookAdsAdPerformance: {
          expression:
            "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(actions) WHERE action_type = 'video_view'))",
        },
      },
    },
    clicks: { type: z.number(), aggregation: "sum", sourceField: "clicks" },
    conversions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "conversions",
      sources: {
        facebookAdsAdPerformance: {
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
        facebookAdsAdPerformance: {
          expression:
            "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(action_values) WHERE action_type = 'purchase'))",
        },
      },
    },
    revenue: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        googleAdsAdPerformance: {
          expression: "SUM(revenue_micros) / 1000000",
        },
        facebookAdsAdPerformance: {
          expression:
            "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(action_values) WHERE action_type = 'purchase'))",
        },
      },
    },
  },
  superlatives: [
    {
      dimensionId: "campaign_id",
      dimensionNameField: "campaign_name",
      dimensionLabel: "Campaign",
      limit: 5,
      metrics: [
        {
          metric: "impressions",
          awards: [VolumeTitanAward, RocketShipAward, FirstPlaceAward],
        },
        {
          metric: "conversions",
          awards: [
            VolumeTitanAward,
            SteadyClimberAward,
            PodiumAward,
            ThreeMonthStreakAward,
          ],
        },
        { metric: "revenue" },
        { metric: "clicks" },
        {
          metric: "roas",
          expression:
            "CASE WHEN SUM(spend) > 50 THEN SAFE_DIVIDE(SUM(revenue), SUM(spend)) ELSE 0 END",
          awards: [
            EfficiencyKingAward,
            DominatorAward,
            RocketShipAward,
            PeakPerformerAward,
            HighRollerAward,
          ],
        },
      ],
    },
    {
      dimensionId: "platform",
      dimensionLabel: "Platform",
      metrics: [
        { metric: "impressions" },
        { metric: "conversions" },
        { metric: "revenue" },
        { metric: "clicks" },
        {
          metric: "roas",
          expression:
            "CASE WHEN SUM(spend) > 50 THEN SAFE_DIVIDE(SUM(revenue), SUM(spend)) ELSE 0 END",
          awards: [EfficiencyKingAward, DominatorAward],
        },
        {
          metric: "conversion_rate",
          expression:
            "CASE WHEN SUM(clicks) > 100 THEN SAFE_DIVIDE(SUM(conversions), SUM(clicks)) ELSE 0 END",
        },
        {
          metric: "cpa",
          rank_type: "lowest",
          expression:
            "CASE WHEN SUM(conversions) > 5 THEN SAFE_DIVIDE(SUM(spend), SUM(conversions)) ELSE 999999 END",
          awards: [EfficiencyKingAward, FirstPlaceAward],
        },
      ],
    },
    {
      dimensionId: "channel_group",
      dimensionLabel: "Channel Group",
      metrics: [
        {
          metric: "video_views",
          awards: [VolumeTitanAward, FirstPlaceAward],
        },
        { metric: "conversions" },
        {
          metric: "roas",
          expression:
            "CASE WHEN SUM(spend) > 50 THEN SAFE_DIVIDE(SUM(revenue), SUM(spend)) ELSE 0 END",
        },
      ],
    },
  ],
});
