import { Entity } from "../../base";
import { googleAdsCoreKeywordPerformance } from "../../imports/google_ads/core-keyword-performance.import";
import { z } from "zod";

const CONVERSION_FOCUSED_STRATEGIES = [
  "TARGET_CPA",
  "TARGET_ROAS",
  "MAXIMIZE_CONVERSIONS",
  "MAXIMIZE_CONVERSION_VALUE",
];

const CLICK_FOCUSED_STRATEGIES = ["TARGET_SPEND", "MANUAL_CPC"];

export const keywordDaily = new Entity({
  id: "keywordDaily",
  description: "Daily keyword performance across ad platforms.",
  source: googleAdsCoreKeywordPerformance,
  partitionBy: "date",
  clusterBy: ["account_id", "campaign_id", "ad_group_id", "keyword_info_text"],
  grain: [
    "date",
    "account_id",
    "campaign_id",
    "ad_group_id",
    "search_term",
    "keyword_info_text",
    "keyword_info_match_type",
    "bidding_strategy_type",
    "campaign",
    "ad_group",
  ],
  dimensions: {
    date: { type: z.string(), sourceField: "date" },
    account_id: { type: z.string(), sourceField: "account_id" },
    campaign_id: { type: z.string(), sourceField: "campaign_id" },
    ad_group_id: { type: z.string(), sourceField: "ad_group_id" },
    search_term: { type: z.string(), sourceField: "search_term" },
    keyword_info_text: { type: z.string(), sourceField: "keyword_info_text" },
    keyword_info_match_type: {
      type: z.string(),
      sourceField: "keyword_info_match_type",
    },
    bidding_strategy_type: {
      type: z.string(),
      sourceField: "bidding_strategy_type",
    },
    campaign: { type: z.string(), sourceField: "campaign" },
    ad_group_name: { type: z.string(), sourceField: "ad_group" },
    strategy_family: {
      type: z.string(),
      expression: `CASE WHEN bidding_strategy_type IN (${CONVERSION_FOCUSED_STRATEGIES.map(
        (s) => `'${s}'`
      ).join(
        ","
      )}) THEN 'conversion' WHEN bidding_strategy_type IN (${CLICK_FOCUSED_STRATEGIES.map(
        (s) => `'${s}'`
      ).join(",")}) THEN 'click' ELSE 'other' END`,
    },
  },
  metrics: {
    impressions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "impressions",
    },
    clicks: { type: z.number(), aggregation: "sum", sourceField: "clicks" },
    spend: { type: z.number(), aggregation: "sum", sourceField: "spend" },
    conversions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "conversions",
    },
    conversions_value: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "conversions_value",
    },
  },
  superlatives: [
    {
      dimensionId: "keyword_info_text",
      dimensionLabel: "keyword_info_text",
      targetMetrics: [
        "clicks",
        "conversions",
        "conversions_value",
        "impressions",
      ],
    },
    {
      dimensionId: "ad_group_id",
      dimensionLabel: "ad_group_name",
      targetMetrics: ["conversions", "conversions_value", "clicks"],
    },
    {
      dimensionId: "campaign_id",
      dimensionLabel: "campaign",
      targetMetrics: ["conversions", "conversions_value", "clicks"],
    },
    {
      dimensionId: "keyword_info_text",
      dimensionLabel: "keyword_info_text",
      targetMetrics: ["roas"],
      expression: "CASE WHEN SUM(spend) > 10 THEN SAFE_DIVIDE(SUM(conversions_value), SUM(spend)) ELSE 0 END",
    },
    {
      dimensionId: "ad_group_id",
      dimensionLabel: "ad_group_name",
      targetMetrics: ["roas"],
      expression: "CASE WHEN SUM(spend) > 25 THEN SAFE_DIVIDE(SUM(conversions_value), SUM(spend)) ELSE 0 END",
    },
    {
      dimensionId: "keyword_info_text",
      dimensionLabel: "keyword_info_text",
      targetMetrics: ["ctr"],
      expression: "CASE WHEN SUM(impressions) > 1000 THEN SAFE_DIVIDE(SUM(clicks), SUM(impressions)) ELSE 0 END",
    },
    {
      dimensionId: "ad_group_id",
      dimensionLabel: "ad_group_name",
      targetMetrics: ["cpa"],
      rank_type: "lowest",
      expression: "CASE WHEN SUM(conversions) > 2 THEN SAFE_DIVIDE(SUM(spend), SUM(conversions)) ELSE 999999 END",
    },
  ],
});
