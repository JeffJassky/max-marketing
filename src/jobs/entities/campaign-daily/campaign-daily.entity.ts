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
});