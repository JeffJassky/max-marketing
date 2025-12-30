import { Monitor } from "../../../../shared/data/monitor";
import { pmaxTotalSpendMeasure } from "../pmax.measures";
import { pmaxDaily } from "../pmax-daily.entity";

export const activePmaxCampaignMonitor = new Monitor({
  id: "active_pmax_campaign_monitor",
  measureId: pmaxTotalSpendMeasure.id,
  enabled: true,
  schedule: "0 8 * * *",
  lookbackDays: 1,
  
  scanConfig: {
    dimensions: ["campaign_id", "account_id", "campaign"],
    minVolume: 0, 
  },
  strategy: {
    type: "threshold",
    max: 0, // Alert if spend > 0 (Active)
  },
  classification: "heuristic",
  impact: {
    type: "financial",
    unit: "$",
    multiplier: 1
  },
  contextMetrics: ["shopping_spend", "youtube_spend", "display_spend", "search_spend", "other_spend", "total_conversions"]
}, pmaxTotalSpendMeasure, pmaxDaily);
