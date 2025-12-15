import { Signal } from "../../../base";
import { keywordDaily } from "../keyword-daily.entity";
import { z } from "zod";

const MIN_SPEND_THRESHOLD = 0;

export const broadMatchDriftSearchTerm = new Signal({
  id: "broadMatchDriftSearchTerm",

  description:
    "Surfaces search terms matched by Broad Match keywords that have high spend but poor performance, indicating potential drift.",

  source: keywordDaily,

  predicate: `
    keyword_info_match_type = 'BROAD'
    AND spend > ${MIN_SPEND_THRESHOLD}
    AND (
      (strategy_family = 'conversion' AND conversions = 0)
      OR
      (strategy_family = 'click' AND clicks = 0)
    )
  `,

  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },

  output: {
    grain: [
      "account_id",
      "campaign_id",
      "ad_group_id",
      "keyword_info_text",
      "search_term",
      "strategy_family",
      "keyword_info_match_type",
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
        type: z.number(),
      },
      cpc: {
        expression: "CASE WHEN clicks > 0 THEN spend / clicks ELSE 0 END",
        type: z.number(),
      },
      cvr: {
        expression: "CASE WHEN clicks > 0 THEN conversions / clicks ELSE 0 END",
        type: z.number(),
      },
      roas: {
        expression:
          "CASE WHEN spend > 0 THEN conversions_value / spend ELSE 0 END",
        type: z.number(),
      },
      drift_score: {
        expression: `(100 * spend) / (spend + 50)`,
        type: z.number(),
      },
    },
  },

  // Sort by drift score or spend, as the order should remain the same
  orderBy: { field: "drift_score", direction: "desc" },

  enabled: true,
});
