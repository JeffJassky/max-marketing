import { Measure } from "../../../shared/data/types";
import { pmaxDaily } from "./pmax-daily.entity";

export const pmaxTotalSpendMeasure: Measure = {
  id: "pmax_total_spend",
  entityId: pmaxDaily.id,
  name: "PMax Total Spend",
  value: { field: "total_spend", aggregation: "sum" },
  allowedDimensions: ["campaign_id", "campaign", "account_id"],
};

export const pmaxShoppingSpendMeasure: Measure = {
  id: "pmax_shopping_spend",
  entityId: pmaxDaily.id,
  name: "PMax Shopping Spend",
  value: { field: "shopping_spend", aggregation: "sum" },
  allowedDimensions: ["campaign_id", "campaign", "account_id"],
};

// ... and so on for other splits if we want individual monitoring.
// For the breakdown aggregateReport replacement, we might just monitor Total Spend and let the dashboard query the details?
// Or we can create a complex measure if needed, but Monitors usually watch ONE number.
