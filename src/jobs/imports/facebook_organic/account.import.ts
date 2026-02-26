import { BronzeImport } from "../../base";
import { z } from "zod";

export const facebookOrganicAccount = new BronzeImport({
  id: "facebookOrganicAccount",
  description: "Facebook page-level metrics including fans, impressions, and engaged users.",
  platform: "facebook_organic",
  endpoint: "facebook_organic",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id"],
  uniquenessKey: ["date", "account_id"],
  params: {
    date_preset: "last_90d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
  },
  metrics: {
    page_fans: z.number(),
    page_fan_adds: z.number(),
    page_fan_removes: z.number(),
    page_impressions: z.number(),
    page_engaged_users: z.number(),
    page_views_total: z.number(),
  },
});
