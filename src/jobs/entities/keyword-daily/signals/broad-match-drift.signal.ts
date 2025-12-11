import { Signal } from "../../../base";
import { keywordDaily } from "../keyword-daily.entity";

const CONVERSION_FOCUSED_STRATEGIES = [
  "TARGET_CPA",
  "TARGET_ROAS",
  "MAXIMIZE_CONVERSIONS",
  "MAXIMIZE_CONVERSION_VALUE",
];

const CLICK_FOCUSED_STRATEGIES = ["TARGET_SPEND", "MANUAL_CPC"];
const MIN_SPEND_THRESHOLD = 10; // $10

export const broadMatchDriftSearchTerm = new Signal({
  id: "broadMatchDriftSearchTerm",

  description:
    "Surfaces search terms matched by Broad Match keywords that have high spend but poor performance, indicating potential drift.",

  source: keywordDaily,

  predicate: `
    keyword_info_match_type = 'BROAD'
    AND spend > ${MIN_SPEND_THRESHOLD}
    AND (
      (bidding_strategy_type IN (${CONVERSION_FOCUSED_STRATEGIES.map(
        (s) => `'${s}'`
      ).join(",")}) AND conversions = 0)
      OR
      (bidding_strategy_type IN (${CLICK_FOCUSED_STRATEGIES.map(
        (s) => `'${s}'`
      ).join(",")}) AND clicks = 0)
    )
  `,

  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },

  groupBy: [
    "account_id",
    "campaign_id",
    "ad_group_id",
    "keyword_info_text",
    "search_term",
    "bidding_strategy_type",
    "keyword_info_match_type",
  ],

  output: {
    keyFields: [
      "account_id",
      "campaign_id",
      "ad_group_id",
      "keyword_info_text",
      "search_term",
    ],

    // Only carry non-group fields; grouped fields are already present
    includeDimensions: ["campaign", "ad_group_name"],

    metrics: {
      impressions: { sourceMetric: "impressions" },
      clicks: { sourceMetric: "clicks" },
      spend: { sourceMetric: "spend" },
      conversions: { sourceMetric: "conversions" },
      conversions_value: { sourceMetric: "conversions_value" },
      last_seen: {
        aggregation: "max",
        expression: "MAX(date)",
      },
    },

    derivedFields: {
      spend: {
        expression: "spend",
        type: "number",
      },
      cpc: {
        expression:
          "CASE WHEN clicks > 0 THEN spend / clicks ELSE 0 END",
        type: "number",
      },
      cvr: {
        expression: "CASE WHEN clicks > 0 THEN conversions / clicks ELSE 0 END",
        type: "number",
      },
      roas: {
        expression:
          "CASE WHEN spend > 0 THEN conversions_value / spend ELSE 0 END",
        type: "number",
      },
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
      drift_score: {
        expression: `(100 * spend) / (spend + 50)`,
        type: "number",
      },
    },
  },

  enabled: true,
});
