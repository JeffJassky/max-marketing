import { Monitor } from "../../../../shared/data/monitor";
import { keywordDaily } from "../keyword-daily.entity";
import { wastedSpendConversionMeasure } from "../keyword.measures";

export const wastedSpendConversionMonitor = new Monitor({
  id: "wasted_spend_conversion_monitor",
  measureId: wastedSpendConversionMeasure.id,
  enabled: true,
  schedule: "0 9 * * *",
  lookbackDays: 30,
  scanConfig: {
    dimensions: ["keyword_info_text", "campaign_id", "ad_group_id", "ad_group_name", "account_id", "search_term", "campaign", "keyword_info_match_type", "strategy_family"],
    minVolume: 0 // Report any wasted spend
  },
  strategy: {
    type: "threshold",
    max: 0
  },
  classification: "known_problem",
  impact: {
    type: "financial",
    unit: "$",
    multiplier: 1
  },
  contextMetrics: ["spend", "clicks", "impressions", "conversions"]
}, wastedSpendConversionMeasure, keywordDaily);
