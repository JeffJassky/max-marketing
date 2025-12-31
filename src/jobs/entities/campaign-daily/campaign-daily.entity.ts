import { Entity } from "../../base";
import { googleAdsCampaignPerformance } from "../../imports/google_ads/campaign-performance.import";
import { z } from "zod";

export const campaignDaily = new Entity({
  id: "campaignDaily",
  description: "Daily campaign performance with high-level channel categorization.",
  source: googleAdsCampaignPerformance,
  partitionBy: "date",
  clusterBy: ["account_id", "campaign_id", "category"],
  grain: [
    "date",
    "account_id",
    "campaign_id",
    "campaign",
    "advertising_channel_type",
    "advertising_channel_sub_type",
  ],
  dimensions: {
    date: { type: z.string(), sourceField: "date" },
    account_id: { type: z.string(), sourceField: "account_id" },
    campaign_id: { type: z.string(), sourceField: "campaign_id" },
    campaign: { type: z.string(), sourceField: "campaign" },
    advertising_channel_type: { type: z.string(), sourceField: "advertising_channel_type" },
    advertising_channel_sub_type: { type: z.string(), sourceField: "advertising_channel_sub_type" },
    category: {
      type: z.string(),
      expression: `
        CASE 
          WHEN advertising_channel_type = 'PERFORMANCE_MAX' THEN 'Performance Max'
          WHEN advertising_channel_type = 'SHOPPING' THEN 'Shopping'
          WHEN advertising_channel_type = 'SEARCH' THEN 'Search'
          WHEN advertising_channel_type = 'DISPLAY' THEN 'Display Network'
          WHEN advertising_channel_type = 'VIDEO' THEN 'YouTube'
          WHEN advertising_channel_type = 'DISCOVERY' THEN 'Discovery'
          ELSE 'Other Google Ads'
        END
      `,
    },
  },
  metrics: {
    spend: {
      type: z.number(),
      aggregation: "sum",
      expression: "SUM(SAFE_CAST(spend AS FLOAT64))",
    },
    impressions: {
      type: z.number(),
      aggregation: "sum",
      expression: "SUM(SAFE_CAST(impressions AS INT64))",
    },
    clicks: {
      type: z.number(),
      aggregation: "sum",
      expression: "SUM(SAFE_CAST(clicks AS INT64))",
    },
    conversions: {
      type: z.number(),
      aggregation: "sum",
      expression: "SUM(SAFE_CAST(conversions AS FLOAT64))",
    },
    conversions_value: {
      type: z.number(),
      aggregation: "sum",
      expression: "SUM(SAFE_CAST(conversions_value AS FLOAT64))",
    },
  },
  superlatives: [
    {
      dimensionId: "campaign_id",
      dimensionLabel: "campaign",
      targetMetrics: ["conversions", "conversions_value", "clicks", "impressions"],
    },
    {
      dimensionId: "advertising_channel_type",
      dimensionLabel: "advertising_channel_type",
      targetMetrics: ["conversions", "conversions_value"],
    },
    {
      dimensionId: "campaign_id",
      dimensionLabel: "campaign",
      targetMetrics: ["roas"],
      expression: "CASE WHEN SUM(spend) > 50 THEN SAFE_DIVIDE(SUM(conversions_value), SUM(spend)) ELSE 0 END",
    },
    {
      dimensionId: "campaign_id",
      dimensionLabel: "campaign",
      targetMetrics: ["conversion_rate"],
      expression: "CASE WHEN SUM(clicks) > 100 THEN SAFE_DIVIDE(SUM(conversions), SUM(clicks)) ELSE 0 END",
    },
    {
      dimensionId: "campaign_id",
      dimensionLabel: "campaign",
      targetMetrics: ["cpa"],
      rank_type: "lowest",
      expression: "CASE WHEN SUM(conversions) > 5 THEN SAFE_DIVIDE(SUM(spend), SUM(conversions)) ELSE 999999 END",
    },
  ],
});