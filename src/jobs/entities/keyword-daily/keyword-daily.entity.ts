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
});
