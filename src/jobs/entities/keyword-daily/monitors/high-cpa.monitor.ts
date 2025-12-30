import { Monitor } from "../../../../shared/data/monitor";
import { keywordDaily } from "../keyword-daily.entity";
import { keywordCPAMeasure } from "../keyword.measures";

export const highCPAMonitor = new Monitor({
  id: "high_cpa_keyword_monitor",
  measureId: keywordCPAMeasure.id,
  enabled: true,
  schedule: "0 9 * * *",
  lookbackDays: 30,
  scanConfig: {
    dimensions: ["keyword_info_text", "account_id", "search_term", "campaign", "ad_group_name", "strategy_family"],
    minVolume: 0 
  },
  strategy: {
    type: "threshold",
    max: 100 // Alert if CPA > 100
  },
  classification: "heuristic",
  impact: {
    type: "performance",
    unit: "$",
    multiplier: 1
  },
  contextMetrics: ["spend", "clicks", "impressions", "conversions", "conversions_value"]
}, keywordCPAMeasure, keywordDaily);
