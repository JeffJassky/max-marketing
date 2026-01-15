import { Entity } from "../../base";
import {
  googleAdsAge,
  googleAdsGender,
} from "../../imports/google_ads/demographics.import";
import { facebookAdsAgeGender } from "../../imports/facebook_ads/demographics.import";
import { ga4Age, ga4Gender } from "../../imports/google_ga4/demographics.import";
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
  sources: [googleAdsAge, googleAdsGender, facebookAdsAgeGender, ga4Age, ga4Gender],
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
        ga4Age: { expression: "'ga4'" },
        ga4Gender: { expression: "'ga4'" },
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
        ga4Age: { sourceField: "age" },
        ga4Gender: { expression: "CAST(NULL AS STRING)" },
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
        ga4Age: { expression: "CAST(NULL AS STRING)" },
        ga4Gender: { expression: "LOWER(gender)" },
      },
    },
  },
  metrics: {
    spend: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "spend",
      sources: {
        ga4Age: { expression: "0" },
        ga4Gender: { expression: "0" },
      },
    },
    impressions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "impressions",
      sources: {
        ga4Age: { expression: "0" },
        ga4Gender: { expression: "0" },
      },
    },
    clicks: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "clicks",
      sources: {
        ga4Age: { sourceField: "sessions" },
        ga4Gender: { sourceField: "sessions" },
      },
    },
    conversions: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "conversions",
      sources: {
        facebookAdsAgeGender: {
          expression:
            "SUM((SELECT SUM(SAFE_CAST(value AS FLOAT64)) FROM UNNEST(actions) WHERE action_type = 'purchase'))",
        },
        ga4Age: { sourceField: "conversions" },
        ga4Gender: { sourceField: "conversions" },
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
        ga4Age: { sourceField: "purchase_revenue" },
        ga4Gender: { sourceField: "purchase_revenue" },
      },
    },
    views: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "screen_page_views",
      sources: {
        googleAdsAge: { expression: "0" },
        googleAdsGender: { expression: "0" },
        facebookAdsAgeGender: { expression: "0" },
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
        { metric: "clicks", awards: [VolumeTitanAward] },
        { metric: "views" },
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
        { metric: "clicks" },
        { metric: "views" },
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
