import { Monitor } from "../../../../shared/data/monitor";
import { facebookSpendMeasure } from "../facebook.measures";
import { facebookSpendDaily } from "../facebook-spend-daily.entity";

export const activeFacebookCampaignMonitor = new Monitor({
  id: "active_facebook_campaign_monitor",
  measureId: facebookSpendMeasure.id,
  enabled: true,
  schedule: "0 8 * * *",
  lookbackDays: 1,
  
  scanConfig: {
    dimensions: ["campaign_id", "account_id"],
    minVolume: 0, 
  },

  strategy: {
    type: "threshold",
    max: 0,
  },
  classification: "heuristic",
}, facebookSpendMeasure, facebookSpendDaily);
