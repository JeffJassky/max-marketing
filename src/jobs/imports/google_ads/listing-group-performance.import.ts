import { BronzeImport } from "../../base";
import { z } from "zod";

export const googleAdsListingGroupPerformance = new BronzeImport({
  id: "listingGroupPerformance",
  description:
    "Listing Group (Asset Group) performance data, primarily used to isolate Shopping spend in PMax campaigns.",
  platform: "google_ads",
  endpoint: "googleAdsListingGroupPerformance",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "campaign_id"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
    campaign_id: z.string(),
    offer_id: z.string(),
  },
  metrics: {
    spend: z.number(),
    clicks: z.number(),
    impressions: z.number(),
    conversions: z.number(),
    conversions_value: z.number(),
  },
});
