import { Entity } from "../../base";
import { googleAdsDevice } from "../../imports/google_ads/device.import";
import { facebookAdsDevice } from "../../imports/facebook_ads/demographics.import";
import { z } from "zod";
import {
  RocketShipAward,
  FirstPlaceAward,
  EfficiencyKingAward,
  VolumeTitanAward,
} from "../../../shared/data/awards/library";

export const deviceDaily = new Entity({
  id: "deviceDaily",
  label: "Device Performance",
  description: "Performance data broken down by device type.",
  sources: [googleAdsDevice, facebookAdsDevice],
  partitionBy: "date",
  clusterBy: ["platform", "account_id", "device_category"],
  grain: [
    "date",
    "account_id",
    "device_category",
    "specific_device",
    "platform",
  ],
  dimensions: {
    date: { type: z.string() },
    account_id: { type: z.string() },
    platform: {
      type: z.string(),
      sources: {
        googleAdsDevice: { expression: "'google'" },
        facebookAdsDevice: { expression: "'facebook'" },
      },
    },
    device_category: {
      type: z.string(),
      sources: {
        googleAdsDevice: {
          expression: "LOWER(device)",
        },
        facebookAdsDevice: {
          expression:
            "CASE WHEN LOWER(device_platform) IN ('mobile_app', 'mobile_web') THEN 'mobile' WHEN LOWER(device_platform) = 'unknown' THEN 'other' ELSE LOWER(device_platform) END",
        },
      },
    },
    specific_device: {
      type: z.string(),
      sources: {
        googleAdsDevice: { expression: "LOWER(device)" },
        facebookAdsDevice: { expression: "LOWER(impression_device)" },
      },
    },
  },
  metrics: {
    spend: { type: z.number(), aggregation: "sum", sourceField: "spend" },
    impressions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "impressions",
    },
    clicks: { type: z.number(), aggregation: "sum", sourceField: "clicks" },
    conversions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "conversions",
      sources: {
        facebookAdsDevice: {
          expression:
            "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(actions) WHERE action_type = 'purchase'))",
        },
      },
    },
    conversions_value: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "conversions_value",
      sources: {
        facebookAdsDevice: {
          expression:
            "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(action_values) WHERE action_type = 'purchase'))",
        },
      },
    },
  },
  superlatives: [
    {
      dimensionId: "device_category",
      dimensionLabel: "Device Category",
      limit: 5,
      metrics: [
        { metric: "spend", awards: [VolumeTitanAward] },
        {
          metric: "roas",
          expression:
            "CASE WHEN SUM(spend) > 50 THEN SAFE_DIVIDE(SUM(conversions_value), SUM(spend)) ELSE 0 END",
          awards: [EfficiencyKingAward, RocketShipAward],
        },
      ],
    },
    {
      dimensionId: "specific_device",
      dimensionLabel: "Specific Device",
      limit: 5,
      metrics: [
        { metric: "conversions", awards: [VolumeTitanAward, FirstPlaceAward] },
      ],
    },
  ],
});
