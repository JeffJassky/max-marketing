import { Measure } from "../../../shared/data/types";
import { creativeDaily } from "./creative-daily.entity";

// 1. Creative CTR Measure
export const creativeCTRMeasure: Measure = {
  id: "creative_ctr_daily",
  entityId: creativeDaily.id,
  name: "Creative CTR",
  description: "Click-through rate at the individual creative level.",
  value: {
    expression: "SAFE_DIVIDE(SUM(clicks), SUM(impressions))",
  },
  allowedDimensions: ["account_id", "platform", "creative_id", "creative_name", "date"],
};

// 2. Creative Spend Measure
export const creativeSpendMeasure: Measure = {
  id: "creative_spend_daily",
  entityId: creativeDaily.id,
  name: "Creative Spend",
  description: "Total spend at the creative level.",
  value: {
    field: "spend",
    aggregation: "sum",
  },
  allowedDimensions: ["account_id", "platform", "creative_id", "creative_name", "date"],
};
