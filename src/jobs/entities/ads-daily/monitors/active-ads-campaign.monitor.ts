import { Monitor } from "../../../../shared/data/monitor";
import { adsSpendMeasure } from "../ads-daily.measures";
import { adsDaily } from "../ads-daily.entity";

export const activeAdsCampaignMonitor = new Monitor({
  id: "active_ads_campaign_monitor",
  measureId: adsSpendMeasure.id,
  enabled: true,
  schedule: "0 8 * * *",
  lookbackDays: 7,
  scanConfig: {
    dimensions: ["campaign_id", "campaign_name", "account_id", "platform"],
    minVolume: 0
  },
  strategy: {
    type: "threshold",
    min: 0.01 // Any campaign with > $0.01 spend is active
  },
  classification: "heuristic",
  impact: {
    type: "operational",
    unit: "active_campaigns",
    multiplier: 1
  }
}, adsSpendMeasure, adsDaily);
