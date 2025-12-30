import { Monitor } from "../../../../shared/data/monitor";
import { keywordDaily } from "../keyword-daily.entity";
import { keywordROASMeasure } from "../keyword.measures";

export const lowROASMonitor = new Monitor({
  id: "low_roas_keyword_monitor",
  measureId: keywordROASMeasure.id,
  enabled: true,
  schedule: "0 9 * * *",
  lookbackDays: 30,
  scanConfig: {
    dimensions: ["keyword_info_text", "account_id", "search_term", "campaign", "ad_group_name", "strategy_family"],
    minVolume: 0
  },
  strategy: {
    type: "threshold",
    min: 1.5 // Alert if ROAS < 1.5
  },
  classification: "heuristic",
  impact: {
    type: "performance",
    unit: "pts",
    multiplier: 1
  },
  contextMetrics: ["spend", "clicks", "impressions", "conversions", "conversions_value"]
}, keywordROASMeasure, keywordDaily);
