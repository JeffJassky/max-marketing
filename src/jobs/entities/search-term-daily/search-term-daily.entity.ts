import { Entity } from "../../base";
import { googleAdsCoreSearchTermPerformance } from "../../imports/google_ads/core-search-term-performance.import";
import { z } from "zod";

export const searchTermDaily = new Entity({
  id: "searchTermDaily",
  description: "Daily search term performance with matched keyword context.",
  source: googleAdsCoreSearchTermPerformance,
  partitionBy: "date",
  clusterBy: [
    "account_id",
    "campaign_id",
    "ad_group_id",
    "keyword_info_text",
    "search_term",
  ],
  grain: [
    "date",
    "account_id",
    "campaign_id",
    "ad_group_id",
    "keyword_info_text",
    "keyword_info_match_type",
    "search_term",
    "bidding_strategy_type",
    "campaign",
    "ad_group",
  ],
  dimensions: {
    date: { type: z.string(), sourceField: "date" },
    account_id: { type: z.string(), sourceField: "account_id" },
    account_name: { type: z.string(), sourceField: "account_name" },
    campaign_id: { type: z.string(), sourceField: "campaign_id" },
    campaign: { type: z.string(), sourceField: "campaign" },
    ad_group_id: { type: z.string(), sourceField: "ad_group_id" },
    ad_group: { type: z.string(), sourceField: "ad_group" },
    keyword_info_text: { type: z.string(), sourceField: "keyword_info_text" },
    keyword_info_match_type: {
      type: z.string(),
      sourceField: "keyword_info_match_type",
    },
    search_term: { type: z.string(), sourceField: "search_term" },
    bidding_strategy_type: {
      type: z.string(),
      sourceField: "bidding_strategy_type",
    },
  },
  metrics: {
    impressions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "impressions",
    },
    clicks: { type: z.number(), aggregation: "sum", sourceField: "clicks" },
    cost_micros: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "cost_micros",
    },
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
