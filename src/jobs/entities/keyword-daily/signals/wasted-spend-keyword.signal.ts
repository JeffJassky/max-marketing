import { Signal } from "../../../base";
import { keywordDaily } from "../keyword-daily.entity";

const CONVERSION_FOCUSED_STRATEGIES = [
  "TARGET_CPA",
  "TARGET_ROAS",
  "MAXIMIZE_CONVERSIONS",
  "MAXIMIZE_CONVERSION_VALUE",
];

const CLICK_FOCUSED_STRATEGIES = ["TARGET_SPEND", "MANUAL_CPC"];

export const wastedSpendKeyword = new Signal({
  id: "wastedSpendKeyword",

  description:
    "Finds keywords with significant spend but no results based on the campaign bidding strategy.",

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
      (spend > 0 AND bidding_strategy_type in ${JSON.stringify(
        CONVERSION_FOCUSED_STRATEGIES
      )} AND conversions == 0)
      OR
      (spend > 0 AND bidding_strategy_type in ${JSON.stringify(
        CLICK_FOCUSED_STRATEGIES
      )} AND clicks == 0)
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
    "bidding_strategy_type",
  ],

  // ---------------------------------------------------------
  // Output Snapshot Specification
  // Defines what gets inserted into signals.wasted_spend_keyword
  // AFTER aggregation.
  // ---------------------------------------------------------
  output: {
    // Dedupe keys — typically identical to groupBy
    keyFields: [
      "account_id",
      "campaign_id",
      "keyword_info_text",
      "bidding_strategy_type",
    ],

    // Non-key label fields to carry through the snapshot
    includeDimensions: ["campaign", "keyword_info_match_type"],

    metrics: {
      impressions: {
        sourceMetric: "impressions",
        // default aggregation = sum (from entity)
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

      // Derived metric from the window — MAX(date)
      last_seen: {
        aggregation: "max",
        expression: "MAX(date)",
      },
    },

    derivedFields: {
      // Very simple impact placeholder: "wasted spend"
      // Can be replaced with more nuanced formula later.
      impact: {
        expression: "spend",
        type: "number",
      },

      // Helpful classification for debugging & modeling
      strategy_family: {
        expression: `
          CASE
            WHEN bidding_strategy_type IN (${CONVERSION_FOCUSED_STRATEGIES.map(
              (s) => `'${s}'`
            ).join(",")}) THEN 'conversion'
            WHEN bidding_strategy_type IN (${CLICK_FOCUSED_STRATEGIES.map(
              (s) => `'${s}'`
            ).join(",")}) THEN 'click'
            ELSE 'other'
          END
        `,
        type: "string",
      },
    },
  },

  enabled: true,
});
