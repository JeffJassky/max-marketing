import { Entity } from "../../base";
import {
  googleAdsAge,
  googleAdsGender,
} from "../../imports/google_ads/demographics.import";
import { facebookAdsAgeGender } from "../../imports/facebook_ads/demographics.import";
import { z } from "zod";
import {
  RocketShipAward,
  FirstPlaceAward,
  PodiumAward,
  ThreeMonthStreakAward,
  EfficiencyKingAward,
  VolumeTitanAward,
} from "../../../shared/data/awards/library";

export const ageGenderDaily = new Entity({
  id: "ageGenderDaily",
  label: "Age & Gender Performance",
  description: "Performance data broken down by age and gender.",
  sources: [googleAdsAge, googleAdsGender, facebookAdsAgeGender],
  partitionBy: "date",
  clusterBy: ["platform", "account_id", "age", "gender"],
  grain: ["date", "account_id", "age", "gender", "platform"],
  dimensions: {
    date: { type: z.string() },
    account_id: { type: z.string() },
    platform: {
      type: z.string(),
      sources: {
        googleAdsAge: { expression: "'google'" },
        googleAdsGender: { expression: "'google'" },
        facebookAdsAgeGender: { expression: "'facebook'" },
      },
    },
    age: {
      type: z.string(),
      sources: {
        googleAdsAge: {
          expression:
            "CASE WHEN age_range_type = 'AGE_RANGE_18_24' THEN '18-24' WHEN age_range_type = 'AGE_RANGE_25_34' THEN '25-34' WHEN age_range_type = 'AGE_RANGE_35_44' THEN '35-44' WHEN age_range_type = 'AGE_RANGE_45_54' THEN '45-54' WHEN age_range_type = 'AGE_RANGE_55_64' THEN '55-64' WHEN age_range_type = 'AGE_RANGE_65_UP' THEN '65+' WHEN age_range_type = 'AGE_RANGE_UNDETERMINED' THEN 'Unknown' ELSE 'Unknown' END",
        },
        googleAdsGender: { expression: "CAST(NULL AS STRING)" },
        facebookAdsAgeGender: { sourceField: "age" },
      },
    },
    gender: {
      type: z.string(),
      sources: {
        googleAdsAge: { expression: "CAST(NULL AS STRING)" },
        googleAdsGender: {
          expression:
            "CASE WHEN LOWER(gender_type) = 'undetermined' THEN 'unknown' ELSE LOWER(gender_type) END",
        },
        facebookAdsAgeGender: {
          expression:
            "CASE WHEN LOWER(gender) = 'undetermined' THEN 'unknown' ELSE LOWER(gender) END",
        },
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
        facebookAdsAgeGender: {
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
        facebookAdsAgeGender: {
          expression:
            "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(action_values) WHERE action_type = 'purchase'))",
        },
      },
    },
  },
  superlatives: [
    {
      dimensionId: "age",
      dimensionLabel: "Age",
      limit: 10,
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
      dimensionId: "gender",
      dimensionLabel: "Gender",
      limit: 3,
      metrics: [
        { metric: "conversions", awards: [VolumeTitanAward, FirstPlaceAward] },
        {
          metric: "roas",
          expression:
            "CASE WHEN SUM(spend) > 50 THEN SAFE_DIVIDE(SUM(conversions_value), SUM(spend)) ELSE 0 END",
          awards: [EfficiencyKingAward],
        },
      ],
    },
  ],
});
