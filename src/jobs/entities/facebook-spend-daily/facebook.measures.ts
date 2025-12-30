import { Measure } from "../../../shared/data/types";
import { facebookSpendDaily } from "./facebook-spend-daily.entity";

export const facebookSpendMeasure: Measure = {
  id: "facebook_spend_daily",
  entityId: facebookSpendDaily.id,
  name: "Facebook Daily Spend",
  value: { field: "spend", aggregation: "sum" },
  allowedDimensions: ["campaign_id", "category"],
};
