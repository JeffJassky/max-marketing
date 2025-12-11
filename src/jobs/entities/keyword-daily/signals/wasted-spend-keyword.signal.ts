import { Signal } from "../../../base";
import { keywordDaily } from "../keyword-daily.entity";


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
      (spend > 0 AND strategy_family = 'conversion' AND conversions == 0)
      OR
      (spend > 0 AND strategy_family = 'click' AND clicks == 0)
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
  output: {
    // Dedupe keys — typically identical to groupBy
    grain: [
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
    },
  },

  orderBy: { field: "impact", direction: "desc" },

  enabled: true,
});
