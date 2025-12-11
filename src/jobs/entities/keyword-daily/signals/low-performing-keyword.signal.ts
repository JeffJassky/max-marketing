import { Signal } from "../../../base";
import { keywordDaily } from "../keyword-daily.entity";

const HIGH_CPA_THRESHOLD = 100; // Example value
const LOW_ROAS_THRESHOLD = 1.5; // Example value


export const lowPerformingKeyword = new Signal({
  id: "lowPerformingKeyword",

  description: "Finds keywords with high CPA or low ROAS.",

  // ---------------------------------------------------------
  // Source Entity
  // ---------------------------------------------------------
  source: keywordDaily,

  // ---------------------------------------------------------
  // Aggregated Predicate (HAVING)
  // Applied after window + groupBy + aggregation.
  // ---------------------------------------------------------
  predicate: `
    keyword_info_text != null AND (
      (
        strategy_family = 'conversion'
        AND conversions > 0
        AND (
          (spend > 0 AND (conversions_value / spend) < ${LOW_ROAS_THRESHOLD})
          OR
          ((spend / conversions) > ${HIGH_CPA_THRESHOLD})
        )
      )
      OR
      (
        strategy_family = 'click'
        AND clicks > 0
        AND spend > 0
        AND conversions > 0
        AND conversions_value > 0
        AND (conversions_value / spend) < ${LOW_ROAS_THRESHOLD}
      )
    )
  `,

  // ---------------------------------------------------------
  // 90-day Snapshot Window
  // ---------------------------------------------------------
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },

  // ---------------------------------------------------------
  // Attribution Grain (Group By)
  // These must correspond to dimensions on keywordDaily.
  // ---------------------------------------------------------
  groupBy: [
    "account_id",
    "campaign_id",
    "keyword_info_text",
    "strategy_family",
  ],

  // ---------------------------------------------------------
  // Output Snapshot Specification
  // Defines what gets inserted into signals.low_performing_keyword
  // AFTER aggregation.
  // ---------------------------------------------------------
  output: {
    // Dedupe keys — typically identical to groupBy
    keyFields: [
      "account_id",
      "campaign_id",
      "keyword_info_text",
      "strategy_family",
    ],

    // Non-key label fields to carry through the snapshot
    includeDimensions: ["campaign", "keyword_info_match_type"],

    metrics: {
      impressions: {
        sourceMetric: "impressions",
      },
      clicks: {
        sourceMetric: "clicks",
      },
      spend: {
        sourceMetric: "spend",
      },
      conversions: {
        sourceMetric: "conversions",
      },
      conversions_value: {
        sourceMetric: "conversions_value",
      },
      last_seen: {
        aggregation: "max",
        expression: "MAX(date)",
      },
    },

    derivedFields: {
      cpa: {
        expression:
          "CASE WHEN conversions > 0 THEN spend / conversions ELSE 0 END",
        type: "number",
      },
      roas: {
        expression:
          "CASE WHEN spend > 0 THEN conversions_value / spend ELSE 0 END",
        type: "number",
      },
      issue: {
        expression: `
          CASE
            WHEN strategy_family = 'conversion' AND (spend / conversions) > ${HIGH_CPA_THRESHOLD} THEN 'High CPA'
            WHEN strategy_family = 'conversion' AND (conversions_value / spend) < ${LOW_ROAS_THRESHOLD} THEN 'Low ROAS'
            WHEN strategy_family = 'click' AND (conversions_value / spend) < ${LOW_ROAS_THRESHOLD} THEN 'Low ROAS (click strategy)'
            ELSE 'Other'
          END
        `,
        type: "string",
      },
      confidenceLevel: {
        expression: `
          CASE
            WHEN spend > 100 THEN 'High'
            WHEN spend > 50 THEN 'Medium'
            ELSE 'Low'
          END
        `,
        type: "string",
      },
      impact: {
        expression: "spend",
        type: "number",
      },
    },
  },

  orderBy: { field: "impact", direction: "desc" },

  enabled: true,
});
