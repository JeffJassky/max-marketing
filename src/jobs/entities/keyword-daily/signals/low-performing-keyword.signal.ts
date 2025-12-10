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
    keyword_text != null AND (
      (conversions > 0 AND (spend / conversions) > ${HIGH_CPA_THRESHOLD})
      OR
      (spend > 0 AND (conversions_value / spend) < ${LOW_ROAS_THRESHOLD})
      OR
      (spend > 10 AND conversions == 0)
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
  groupBy: ["account_id", "campaign_id", "keyword_text"],

  // ---------------------------------------------------------
  // Output Snapshot Specification
  // Defines what gets inserted into signals.low_performing_keyword
  // AFTER aggregation.
  // ---------------------------------------------------------
  output: {
    // Dedupe keys — typically identical to groupBy
    keyFields: ["account_id", "campaign_id", "keyword_text"],

    // Non-key label fields to carry through the snapshot
    includeDimensions: ["campaign", "keyword_match_type"],

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
        expression: "CASE WHEN conversions > 0 THEN spend / conversions ELSE 0 END",
        type: "number",
      },
      roas: {
        expression: "CASE WHEN spend > 0 THEN conversions_value / spend ELSE 0 END",
        type: "number",
      },
      issue: {
        expression: `
          CASE
            WHEN conversions > 0 AND (spend / conversions) > ${HIGH_CPA_THRESHOLD} THEN 'High CPA'
            WHEN spend > 0 AND (conversions_value / spend) < ${LOW_ROAS_THRESHOLD} THEN 'Low ROAS'
            WHEN spend > 10 AND conversions = 0 THEN 'Zero Conversions'
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

  enabled: true,
});
