import { BronzeImport } from "../../base";
import { z } from "zod";

export const googleAdsCoreSearchTermPerformance = new BronzeImport({
  id: "coreSearchTermPerformance",
  description:
    "Search term performance with keyword, campaign, and ad group context for analyzing match type drift.",
  platform: "google_ads",
  endpoint: "googleAdsSearchTermPerformance",
  version: 1,
  partitionBy: "date",
  clusterBy: ["campaign_id", "ad_group_id", "keyword_info_text", "search_term"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    campaign: z.string(),
    campaign_id: z.string(),
    ad_group: z.string(),
    ad_group_id: z.string(),
    keyword_info_text: z.string(),
    keyword_info_match_type: z.string(),
    search_term: z.string(),
    bidding_strategy_type: z.string(),
  },
  metrics: {
    impressions: z.number(),
    clicks: z.number(),
    cost_micros: z.number(),
    conversions: z.number(),
    conversions_value: z.number(),
  },
});
