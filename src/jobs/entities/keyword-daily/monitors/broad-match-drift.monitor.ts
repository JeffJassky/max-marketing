import { Monitor } from "../../../../shared/data/monitor";
import { keywordDaily } from "../keyword-daily.entity";
import { broadMatchDriftScoreMeasure } from "../keyword.measures";

export const broadMatchDriftMonitor = new Monitor({
  id: "broad_match_drift_monitor",
  measureId: broadMatchDriftScoreMeasure.id,
  enabled: true,
  schedule: "0 9 * * *",
  lookbackDays: 30,
  scanConfig: {
    dimensions: ["search_term", "campaign_id", "account_id", "keyword_info_text", "keyword_info_match_type", "campaign", "ad_group_name"],
    minVolume: 0
  },
  strategy: {
    type: "threshold",
    max: 50
  },
  classification: "heuristic",
  contextMetrics: ["spend", "clicks", "impressions", "conversions", "conversions_value"]
}, broadMatchDriftScoreMeasure, keywordDaily);
