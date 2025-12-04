import {
  WindsorImportRegistry,
  WindsorImportQuery,
  WindsorEndpoint,
} from "../shared/vendors/windsor/windsor.d";

const defineBronzeImport = <E extends WindsorEndpoint>(
  preset: WindsorImportQuery<E>
) => preset;

export const windsorImportQueries = {
  //   facebookPurchaseAttribution30d: defineBronzeImport({
  //     connector: "windsor",
  //     platform: "facebook",
  //     datasetId: "purchaseAttribution30d",
  //     description:
  //       "Rolling 30-day Meta purchase attribution snapshot with adset and age granularity for ROAS tracking.",
  //     request: {
  //       endpoint: "facebookAdsCampaigns",
  //       metrics: [
  //         "spend",
  //         "clicks",
  //         "action_values_offsite_conversion_fb_pixel_purchase",
  //         "action_values_purchase",
  //         "actions_offsite_conversion_fb_pixel_purchase",
  //         "actions_onsite_conversion_purchase",
  //         "catalog_segment_value_omni_purchase_roas",
  //         "cost_per_action_type_offsite_conversion_fb_pixel_purchase",
  //         "cost_per_action_type_onsite_conversion_purchase",
  //         "unique_actions_offsite_conversion_fb_pixel_purchase",
  //         "unique_actions_onsite_conversion_purchase",
  //         "website_purchase_roas_offsite_conversion_fb_pixel_purchase",
  //       ],
  //       dimensions: [
  //         "datasource",
  //         "source",
  //         "date",
  //         "name",
  //         "account_name",
  //         "campaign",
  //         "adset_id",
  //         "adset_name",
  //         "age",
  //       ],
  //       params: {
  //         date_preset: "last_30d",
  //         select_accounts: ["1885761745542067"],
  //       },
  //     },
  //     destination: {
  //       dataset: "bronze",
  //       table: "meta_purchase_attribution_30d_v1",
  //       partition_by: "date",
  //       cluster_by: ["account_name", "campaign"],
  //       schema_version: 1,
  //     },
  //     backfillPresets: ["last_30d"],
  //   }),
  googleAdsCoreKeywordPerformance: defineBronzeImport({
    connector: "windsor",
    platform: "google_ads",
    datasetId: "coreKeywordPerformance",
    description:
      "Keyword-level performance with campaign and ad group context for identifying top and underperforming terms.",
    request: {
      endpoint: "googleAdsKeywordPerformance",
      metrics: [
        "spend",
        "impressions",
        "clicks",
        "conversions",
        "conversions_value",
        "ctr",
        "average_cpc",
        "cost_per_conversion",
      ],
      dimensions: [
        "date",
        "account_id",
        "account_name",
        "campaign",
        "campaign_id",
        "ad_group",
        "ad_group_id",
        "keyword_text",
        "keyword_match_type",
        "bidding_strategy_type",
      ],
      params: {
        date_preset: "last_90d",
      },
    },
    destination: {
      dataset: "bronze",
      table: "google_ads_keyword_performance_v1",
      partition_by: "date",
      cluster_by: ["campaign_id", "ad_group_id", "keyword_text"],
      schema_version: 1,
    },
    backfillPresets: ["last_90d"],
  }),
  //   googleAdsKeywordQuality: defineBronzeImport({
  //     connector: "windsor",
  //     platform: "google_ads",
  //     datasetId: "keywordQuality",
  //     description:
  //       "Keyword quality score, bid, and policy metadata for diagnosing performance gaps.",
  //     request: {
  //       endpoint: "googleAdsKeywordQuality",
  //       metrics: ["quality_score", "cpc_bid", "status", "approval_status"],
  //       dimensions: [
  //         "campaign",
  //         "ad_group",
  //         "keyword_text",
  //         "keyword_match_type",
  //       ],
  //       params: {
  //         date_preset: "last_30d",
  //       },
  //     },
  //     destination: {
  //       dataset: "bronze",
  //       table: "google_ads_keyword_quality_v1",
  //       cluster_by: ["campaign", "ad_group", "keyword_text"],
  //       schema_version: 1,
  //     },
  //     backfillPresets: ["last_30d"],
  //   }),
  //   googleAdsSearchTerms: defineBronzeImport({
  //     connector: "windsor",
  //     platform: "google_ads",
  //     datasetId: "searchTerms",
  //     description:
  //       "Search term level performance mapped to matched keywords for query mining.",
  //     request: {
  //       endpoint: "googleAdsSearchTerms",
  //       metrics: [
  //         "spend",
  //         "impressions",
  //         "clicks",
  //         "conversions",
  //         "ctr",
  //         "average_cpc",
  //       ],
  //       dimensions: [
  //         "date",
  //         "campaign",
  //         "ad_group",
  //         "search_term",
  //         "keyword_text",
  //         "keyword_match_type",
  //       ],
  //       params: {
  //         date_preset: "last_30d",
  //       },
  //     },
  //     destination: {
  //       dataset: "bronze",
  //       table: "google_ads_search_terms_v1",
  //       partition_by: "date",
  //       cluster_by: ["campaign", "ad_group", "keyword_text"],
  //       schema_version: 1,
  //     },
  //     backfillPresets: ["last_30d"],
  //   }),
  //   googleAdsKeywordDeviceNetwork: defineBronzeImport({
  //     connector: "windsor",
  //     platform: "google_ads",
  //     datasetId: "keywordDeviceNetwork",
  //     description:
  //       "Keyword performance segmented by device and network to guide bid adjustments.",
  //     request: {
  //       endpoint: "googleAdsKeywordDeviceNetwork",
  //       metrics: [
  //         "spend",
  //         "impressions",
  //         "clicks",
  //         "conversions",
  //         "conversion_rate",
  //       ],
  //       dimensions: [
  //         "date",
  //         "campaign",
  //         "ad_group",
  //         "keyword_text",
  //         "device",
  //         "ad_network_type",
  //       ],
  //       params: {
  //         date_preset: "last_30d",
  //       },
  //     },
  //     destination: {
  //       dataset: "bronze",
  //       table: "google_ads_keyword_device_network_v1",
  //       partition_by: "date",
  //       cluster_by: ["keyword_text", "device"],
  //       schema_version: 1,
  //     },
  //     backfillPresets: ["last_30d"],
  //   }),
  //   googleAdsKeywordTrends: defineBronzeImport({
  //     connector: "windsor",
  //     platform: "google_ads",
  //     datasetId: "keywordTrends",
  //     description:
  //       "Daily keyword time-series for monitoring directional shifts and seasonality.",
  //     request: {
  //       endpoint: "googleAdsKeywordTrends",
  //       metrics: ["spend", "impressions", "clicks", "conversions", "ctr"],
  //       dimensions: ["date", "campaign", "ad_group", "keyword_text"],
  //       params: {
  //         date_preset: "last_30d",
  //       },
  //     },
  //     destination: {
  //       dataset: "bronze",
  //       table: "google_ads_keyword_trends_v1",
  //       partition_by: "date",
  //       cluster_by: ["keyword_text"],
  //       schema_version: 1,
  //     },
  //     backfillPresets: ["last_30d"],
  //   }),
  //   googleAdsSearchTermConversions: defineBronzeImport({
  //     connector: "windsor",
  //     platform: "google_ads",
  //     datasetId: "searchTermConversions",
  //     description:
  //       "Search term to conversion action mapping for prioritizing intent-driven optimizations.",
  //     request: {
  //       endpoint: "googleAdsSearchTermConversions",
  //       metrics: ["spend", "impressions", "clicks", "conversions"],
  //       dimensions: [
  //         "date",
  //         "campaign",
  //         "ad_group",
  //         "search_term",
  //         "keyword_text",
  //         "conversion_action",
  //       ],
  //       params: {
  //         date_preset: "last_30d",
  //       },
  //     },
  //     destination: {
  //       dataset: "bronze",
  //       table: "google_ads_search_term_conversions_v1",
  //       partition_by: "date",
  //       cluster_by: ["conversion_action", "keyword_text"],
  //       schema_version: 1,
  //     },
  //     backfillPresets: ["last_30d"],
  //   }),
  //   googleAdsNegativeKeywordCandidates: defineBronzeImport({
  //     connector: "windsor",
  //     platform: "google_ads",
  //     datasetId: "negativeKeywordCandidates",
  //     description:
  //       "High-spend, low-efficiency search terms matched to keywords for negative keyword workflows.",
  //     request: {
  //       endpoint: "googleAdsNegativeKeywordCandidates",
  //       metrics: [
  //         "spend",
  //         "impressions",
  //         "clicks",
  //         "conversions",
  //         "ctr",
  //         "cost_per_conversion",
  //       ],
  //       dimensions: [
  //         "date",
  //         "campaign",
  //         "ad_group",
  //         "search_term",
  //         "keyword_text",
  //         "keyword_match_type",
  //       ],
  //       params: {
  //         date_preset: "last_30d",
  //       },
  //     },
  //     destination: {
  //       dataset: "bronze",
  //       table: "google_ads_negative_keyword_candidates_v1",
  //       partition_by: "date",
  //       cluster_by: ["campaign", "search_term"],
  //       schema_version: 1,
  //     },
  //     backfillPresets: ["last_30d"],
  //   }),
  //   googleAdsKeywordCpaRanking: defineBronzeImport({
  //     connector: "windsor",
  //     platform: "google_ads",
  //     datasetId: "keywordCpaRanking",
  //     description:
  //       "Keyword CPA leaderboard for surfacing the most and least efficient spend drivers.",
  //     request: {
  //       endpoint: "googleAdsKeywordCpaRanking",
  //       metrics: [
  //         "cost_per_conversion",
  //         "conversions",
  //         "spend",
  //         "impressions",
  //         "clicks",
  //       ],
  //       dimensions: [
  //         "campaign",
  //         "ad_group",
  //         "keyword_text",
  //         "keyword_match_type",
  //       ],
  //       params: {
  //         date_preset: "last_30d",
  //         sort: "cost_per_conversion",
  //         order: "asc",
  //       },
  //     },
  //     destination: {
  //       dataset: "bronze",
  //       table: "google_ads_keyword_cpa_ranking_v1",
  //       cluster_by: ["campaign", "ad_group"],
  //       schema_version: 1,
  //     },
  //     backfillPresets: ["last_30d"],
  //   }),
} satisfies WindsorImportRegistry;

export type WindsorImportKey = keyof typeof windsorImportQueries;
