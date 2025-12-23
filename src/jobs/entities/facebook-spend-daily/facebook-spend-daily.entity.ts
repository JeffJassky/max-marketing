import { Entity } from "../../base";
import { facebookAdsInsights } from "../../imports/facebook_ads/insights.import";
import { z } from "zod";

export const facebookSpendDaily = new Entity({
  id: "facebookSpendDaily",
  description: "Daily Facebook/Meta spend performance categorized by placement.",
  source: facebookAdsInsights,
  partitionBy: "date",
  clusterBy: ["account_id", "campaign_id", "category"],
  grain: [
    "date",
    "account_id",
    "campaign_id",
    "campaign_name",
    "publisher_platform",
    "platform_position",
  ],
  dimensions: {
    date: { type: z.string(), sourceField: "date" },
    account_id: { type: z.string(), sourceField: "account_id" },
    campaign_id: { type: z.string(), sourceField: "campaign_id" },
    campaign_name: { type: z.string(), sourceField: "campaign_name" },
    publisher_platform: { type: z.string(), sourceField: "publisher_platform" },
    platform_position: { type: z.string(), sourceField: "platform_position" },
    category: {
      type: z.string(),
      expression: `
        CASE 
          WHEN platform_position LIKE '%story%' THEN 'Stories'
          WHEN platform_position LIKE '%reels%' THEN 'Reels'
          WHEN platform_position LIKE '%feed%' THEN 'Feed'
          WHEN platform_position LIKE '%marketplace%' THEN 'Marketplace'
          WHEN publisher_platform = 'audience_network' THEN 'Audience Network'
          ELSE 'Other'
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
      expression: "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(actions)))",
    },
  },
});