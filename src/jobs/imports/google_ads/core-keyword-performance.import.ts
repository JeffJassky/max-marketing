import { BronzeImport, BronzeImportDef } from "../../base";
import { z } from "zod";

export const googleAdsCoreKeywordPerformance = new BronzeImport({
  id: "coreKeywordPerformance",
  description:
    "Keyword-level performance with campaign and ad group context for identifying top and underperforming terms.",
  platform: "google_ads",
  endpoint: "googleAdsKeywordPerformance",
  version: 1,
  partitionBy: "date",
  clusterBy: ["campaign_id", "ad_group_id", "keyword_text"],
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
    keyword_text: z.string(),
    keyword_match_type: z.string(),
    bidding_strategy_type: z.string(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    conversions: z.number(),
    conversions_value: z.number(),
    ctr: z.number(),
    average_cpc: z.number(),
    cost_per_conversion: z.number(),
  },
});
