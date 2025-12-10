import { Entity } from "../../base";
import { googleAdsCoreKeywordPerformance } from "../../imports/google_ads/core-keyword-performance.import";
import { z } from "zod";

export const keywordDaily = new Entity({
  id: "keywordDaily",
  description: "Daily keyword performance across ad platforms.",
  source: googleAdsCoreKeywordPerformance,
  partitionBy: "date",
  clusterBy: ["account_id", "campaign_id", "ad_group_id", "keyword_text"],
  grain: [
    "date",
    "account_id",
    "campaign_id",
    "ad_group_id",
    "keyword_text",
    "keyword_match_type",
    "bidding_strategy_type",
    "campaign",
    "ad_group",
  ],
  dimensions: {
    date: { type: z.string(), sourceField: "date" },
    account_id: { type: z.string(), sourceField: "account_id" },
    campaign_id: { type: z.string(), sourceField: "campaign_id" },
    ad_group_id: { type: z.string(), sourceField: "ad_group_id" },
    keyword_text: { type: z.string(), sourceField: "keyword_text" },
    keyword_match_type: { type: z.string(), sourceField: "keyword_match_type" },
    bidding_strategy_type: {
      type: z.string(),
      sourceField: "bidding_strategy_type",
    },
    campaign: { type: z.string(), sourceField: "campaign" },
    ad_group_name: { type: z.string(), sourceField: "ad_group" },
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
