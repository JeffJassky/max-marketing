import { Measure } from "../../../shared/data/types";
import { campaignDaily } from "./campaign-daily.entity";

// 1. Spend Measure
export const campaignSpendMeasure: Measure = {
  id: "campaign_spend_daily",
  entityId: campaignDaily.id,
  name: "Daily Campaign Spend",
  description: "Sum of daily spend, allowing breakdown by account, campaign, or channel.",
  value: {
    field: "spend",
    aggregation: "sum",
  },
  allowedDimensions: [
    "account_id",
    "campaign_id",
    "advertising_channel_type",
    "category",
    "date"
  ],
};

// 2. Conversion Measure
export const campaignConversionsMeasure: Measure = {
  id: "campaign_conversions_daily",
  entityId: campaignDaily.id,
  name: "Daily Campaign Conversions",
  description: "Sum of daily conversions.",
  value: {
    field: "conversions",
    aggregation: "sum",
  },
  allowedDimensions: [
    "account_id",
    "campaign_id",
    "advertising_channel_type",
    "category",
    "date"
  ],
};
