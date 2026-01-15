import { Entity } from "../../base";
import { googleAdsCoreKeywordPerformance } from "../../imports/google_ads/core-keyword-performance.import";
import { z } from "zod";
import {
  VolumeTitanAward,
  NewEntryAward,
  SteadyClimberAward,
  EfficiencyKingAward,
  RocketShipAward,
  HighROASAward,
  GoldMineAward,
} from "../../../shared/data/awards/library";
import { AwardDefinition } from "../../../shared/data/types";

const CONVERSION_FOCUSED_STRATEGIES = [
  "TARGET_CPA",
  "TARGET_ROAS",
  "MAXIMIZE_CONVERSIONS",
  "MAXIMIZE_CONVERSION_VALUE",
];

const CLICK_FOCUSED_STRATEGIES = ["TARGET_SPEND", "MANUAL_CPC"];

export const keywordDaily = new Entity({
  id: "keywordDaily",
  label: "Keyword Performance",
  description: "Daily keyword performance across ad platforms.",
  sources: [googleAdsCoreKeywordPerformance],
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
      dimensionId: "search_term",
      dimensionLabel: "Search Term",
      limit: 5,
      metrics: [
        {
          metric: "gold_mine_score",
          expression: "CASE WHEN SUM(spend) < 50 AND SUM(conversions) > 0 THEN SUM(conversions) ELSE 0 END",
          awards: [GoldMineAward],
        },
      ],
    },
    {
      dimensionId: "keyword_info_text",
      dimensionLabel: "Keyword",
      limit: 20,
      metrics: [
        { metric: "clicks" },
        { 
          metric: "conversions",
          awards: [VolumeTitanAward, NewEntryAward, SteadyClimberAward] 
        },
        { metric: "conversions_value" },
        { metric: "impressions" },
        {
          metric: "roas",
          expression:
            "CASE WHEN SUM(spend) > 10 THEN SAFE_DIVIDE(SUM(conversions_value), SUM(spend)) ELSE 0 END",
          awards: [EfficiencyKingAward, HighROASAward, RocketShipAward]
        },
        {
          metric: "ctr",
          expression:
            "CASE WHEN SUM(impressions) > 1000 THEN SAFE_DIVIDE(SUM(clicks), SUM(impressions)) ELSE 0 END",
        },
      ],
    },
    {
      dimensionId: "ad_group_id",
      dimensionNameField: "ad_group_name",
      dimensionLabel: "Ad Group",
      limit: 10,
      metrics: [
        {
          metric: "cpa",
          rank_type: "lowest",
          expression:
            "CASE WHEN SUM(conversions) > 2 THEN SAFE_DIVIDE(SUM(spend), SUM(conversions)) ELSE 999999 END",
          awards: [EfficiencyKingAward, SteadyClimberAward]
        },
      ],
    },
    {
      dimensionId: "campaign_id",
      dimensionNameField: "campaign",
      dimensionLabel: "Campaign",
      metrics: [
        { metric: "conversions" },
        { metric: "conversions_value" },
        { metric: "clicks" },
      ],
    },
  ],
});
