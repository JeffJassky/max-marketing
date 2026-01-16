import { Measure } from "../../../shared/data/types";
import { adsDaily } from "./ads-daily.entity";

// 1. Unified Spend Measure
export const adsSpendMeasure: Measure = {
  id: "ads_spend_daily",
  entityId: adsDaily.id,
  name: "Daily Ad Spend",
  description: "Unified spend across Google and Meta Ads.",
  value: {
    field: "spend",
    aggregation: "sum",
  },
  allowedDimensions: ["account_id", "platform", "campaign_id", "channel_group", "date"],
};

// 2. Unified Conversion Measure
export const adsConversionsMeasure: Measure = {
  id: "ads_conversions_daily",
  entityId: adsDaily.id,
  name: "Daily Ad Conversions",
  description: "Unified conversions across Google and Meta Ads.",
  value: {
    field: "conversions",
    aggregation: "sum",
  },
  allowedDimensions: ["account_id", "platform", "campaign_id", "channel_group", "date"],
};

// 3. Unified Sales Volume (Revenue) Measure
export const adsSalesVolumeMeasure: Measure = {
  id: "ads_sales_volume_daily",
  entityId: adsDaily.id,
  name: "Daily Sales Volume",
  description: "Unified revenue/conversions value across Google and Meta Ads.",
  value: {
    field: "conversions_value",
    aggregation: "sum",
  },
  allowedDimensions: ["account_id", "platform", "campaign_id", "channel_group", "date"],
};

// 4. Unified Frequency Measure (Mainly Meta)
export const adsFrequencyMeasure: Measure = {
  id: "ads_frequency_daily",
  entityId: adsDaily.id,
  name: "Ad Frequency",
  description: "Average number of times a single person has seen the ad (Impressions / Reach).",
  value: {
    expression: "SAFE_DIVIDE(SUM(impressions), SUM(reach))",
  },
  allowedDimensions: ["account_id", "platform", "campaign_id", "adset_id", "date"],
};

// 5. Unified ROAS Measure
export const adsROASMeasure: Measure = {
  id: "ads_roas_daily",
  entityId: adsDaily.id,
  name: "Ad ROAS",
  description: "Return on Ad Spend (Revenue / Spend).",
  value: {
    expression: "SAFE_DIVIDE(SUM(conversions_value), SUM(spend))",
  },
  allowedDimensions: ["account_id", "platform", "campaign_id", "adset_id", "channel_group", "date"],
};
