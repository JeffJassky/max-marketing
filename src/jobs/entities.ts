import { defineEntity } from "../shared/data/types";

export const keywordDaily = defineEntity({
  id: "keywordDaily",
  description: "Daily keyword performance across ad platforms.",

  // ── PIPELINE / ETL DEFINITION ─────────────────────────────────────
  pipeline: {
    sources: [
      {
        id: "google_ads_keywords",
        dataset: "bronze",
        table: "google_ads_keyword_performance_v1",
      },
    ],

    // How to convert bronze → silver for THIS entity
    transform: {
      mode: "sql",
      sql: `
        SELECT
          account_id,
          campaign_id,
		  campaign,
          ad_group_id,
		  bidding_strategy_type,
          TRIM(LOWER(keyword_text)) AS keyword_text,
          keyword_match_type,
          date,
          campaign AS campaign_name,
          ad_group AS ad_group_name,
          SUM(impressions) AS impressions,
          SUM(clicks) AS clicks,
          SUM(spend) AS spend,
          SUM(conversions) AS conversions,
          SUM(conversions_value) AS conversions_value
        FROM bronze.google_ads_keyword_performance_v1
        WHERE keyword_text IS NOT NULL
          AND LENGTH(TRIM(keyword_text)) > 0
        GROUP BY
          account_id,
          campaign_id,
          ad_group_id,
          keyword_text,
          keyword_match_type,
		  bidding_strategy_type,
          date,
          campaign,
          ad_group
      `,
    },

    // Where the SILVER data for this entity lives
    storage: {
      dataset: "silver_marketing",
      table: "keyword_performance_daily",
      materialized: true,
      partitionBy: "date",
      clusterBy: ["account_id", "campaign_id", "ad_group_id", "keyword_text"],
    },

    // Orchestration / cadence
    schedule: {
      mode: "onBronzeIngest",
      dependsOnBronze: ["bronze.google_ads_keyword_performance_v1"],
    },
  },

  // ── RUNTIME SHAPE (WHAT SIGNALS & UI SEE) ────────────────────────
  grain: ["account_id", "campaign_id", "ad_group_id", "keyword_text", "date"],

  metrics: {
    impressions: { type: "number" },
    clicks: { type: "number" },
    spend: { type: "number" },
    conversions: { type: "number" },
    conversions_value: { type: "number" },
  },

  dimensions: {
    account_id: { type: "string" },
    date: { type: "date" },
    campaign_id: { type: "string" },
    campaign: { type: "string", optional: true },
    ad_group_id: { type: "string" },
    ad_group_name: { type: "string", optional: true },
    keyword_text: { type: "string" },
    keyword_match_type: { type: "string" },
    bidding_strategy_type: { type: "string" },
  },

  defaults: {
    windowDays: 30,
  },

  capabilities: {
    supportsCustomDateRange: true,
    supportsAccountFiltering: true,
    minWindowDays: 7,
  },
});

export const entities = { keywordDaily };
