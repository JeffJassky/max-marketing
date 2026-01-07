import { BronzeImport } from "../../base";
import { z } from "zod";

export const googleAdsAge = new BronzeImport({
  id: "googleAdsAge",
  description: "Google Ads performance data broken down by age.",
  platform: "google_ads",
  endpoint: "googleAdsDemographics",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id"],
  params: {
    date_preset: "last_90d",
    date_aggregation: "month",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    age_range_type: z.string(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    conversions: z.number(),
    conversions_value: z.number(),
  },
});

export const googleAdsGender = new BronzeImport({
  id: "googleAdsGender",
  description: "Google Ads performance data broken down by gender.",
  platform: "google_ads",
  endpoint: "googleAdsDemographics",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id"],
  params: {
    date_preset: "last_90d",
    date_aggregation: "month",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    gender_type: z.string(),
  },
  metrics: {
    spend: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    conversions: z.number(),
    conversions_value: z.number(),
  },
});
