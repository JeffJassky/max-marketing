import { Measure } from "../../../shared/data/types";
import { keywordDaily } from "./keyword-daily.entity";

// 1. Wasted Spend Measures
export const wastedSpendConversionMeasure: Measure = {
  id: "wasted_spend_conversion",
  entityId: keywordDaily.id,
  name: "Wasted Spend (Conversion Strategy)",
  description: "Spend on keywords with conversion strategy but 0 conversions.",
  value: { field: "spend", aggregation: "sum" },
  filters: [
    { field: "strategy_family", op: "=", value: "conversion" },
    { field: "conversions", op: "=", value: 0 },
  ],
  allowedDimensions: ["keyword_info_text", "campaign_id", "ad_group_id"],
};

export const wastedSpendClickMeasure: Measure = {
  id: "wasted_spend_click",
  entityId: keywordDaily.id,
  name: "Wasted Spend (Click Strategy)",
  description: "Spend on keywords with click strategy but 0 clicks.",
  value: { field: "spend", aggregation: "sum" },
  filters: [
    { field: "strategy_family", op: "=", value: "click" },
    { field: "clicks", op: "=", value: 0 },
  ],
  allowedDimensions: ["keyword_info_text", "campaign_id", "ad_group_id"],
};

// 2. Efficiency Measures (Expression-based)
export const keywordCPAMeasure: Measure = {
  id: "keyword_cpa",
  entityId: keywordDaily.id,
  name: "Keyword CPA",
  value: { 
    expression: "SAFE_DIVIDE(SUM(spend), SUM(conversions))" // utilizing BQ safe_divide
  },
  filters: [
    { field: "conversions", op: ">", value: 0 } // CPA only valid if conversions exist? Or handle in expression? SAFE_DIVIDE handles it.
  ],
  allowedDimensions: ["keyword_info_text", "campaign_id", "search_term"],
};

export const keywordROASMeasure: Measure = {
  id: "keyword_roas",
  entityId: keywordDaily.id,
  name: "Keyword ROAS",
  value: { 
    expression: "SAFE_DIVIDE(SUM(conversions_value), SUM(spend))"
  },
  filters: [
    { field: "spend", op: ">", value: 0 }
  ],
  allowedDimensions: ["keyword_info_text", "campaign_id", "search_term"],
};

// 3. Drift Measures
export const broadMatchDriftScoreMeasure: Measure = {
  id: "broad_match_drift_score",
  entityId: keywordDaily.id,
  name: "Broad Match Drift Score",
  value: {
    expression: "(100 * SUM(spend)) / (SUM(spend) + 50)"
  },
  filters: [
    { field: "keyword_info_match_type", op: "=", value: "BROAD" }
  ],
  allowedDimensions: ["search_term", "keyword_info_text", "campaign_id"],
};
