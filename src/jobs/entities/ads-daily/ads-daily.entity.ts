import { Entity } from "../../base";
import { googleAdsCampaignPerformance } from "../../imports/google_ads/campaign-performance.import";
import { facebookAdsInsights } from "../../imports/facebook_ads/insights.import";
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
  description: "Unified daily performance across Google and Meta Ads.",
  sources: [googleAdsCampaignPerformance, facebookAdsInsights],
  partitionBy: "date",
  clusterBy: ["platform", "account_id", "campaign_id", "adset_id"],
  grain: ["date", "account_id", "campaign_id", "adset_id", "platform"],
  dimensions: {
    date: { type: z.string() },
    account_id: { type: z.string() },
    platform: {
      type: z.string(),
      sources: {
        campaignPerformance: { expression: "'google'" },
        facebookAdsInsights: { expression: "'facebook'" },
      },
    },
    campaign_id: { type: z.string() },
    campaign_name: {
      type: z.string(),
      sourceField: "campaign_name",
      sources: {
        campaignPerformance: { sourceField: "campaign" },
      },
    },
    adset_id: {
      type: z.string(),
      sources: {
        campaignPerformance: { expression: "CAST(NULL AS STRING)" },
        facebookAdsInsights: { sourceField: "adset_id" },
      },
    },
    adset_name: {
      type: z.string(),
      sources: {
        campaignPerformance: { expression: "CAST(NULL AS STRING)" },
        facebookAdsInsights: { sourceField: "adset_name" },
      },
    },
    channel_group: {
      type: z.string(),
      sourceField: "publisher_platform",
      sources: {
        campaignPerformance: { sourceField: "advertising_channel_type" },
        facebookAdsInsights: {
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
        campaignPerformance: { expression: "0" },
      },
    },
    video_views: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "video_views",
      sources: {
        facebookAdsInsights: {
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
        facebookAdsInsights: {
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
        facebookAdsInsights: {
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
        { metric: "conversions_value" },
        { metric: "clicks" },
        {
          metric: "roas",
          expression:
            "CASE WHEN SUM(spend) > 50 THEN SAFE_DIVIDE(SUM(conversions_value), SUM(spend)) ELSE 0 END",
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
        { metric: "conversions_value" },
        { metric: "clicks" },
        {
          metric: "roas",
          expression:
            "CASE WHEN SUM(spend) > 50 THEN SAFE_DIVIDE(SUM(conversions_value), SUM(spend)) ELSE 0 END",
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
            "CASE WHEN SUM(spend) > 50 THEN SAFE_DIVIDE(SUM(conversions_value), SUM(spend)) ELSE 0 END",
        },
      ],
    },
  ],
});
