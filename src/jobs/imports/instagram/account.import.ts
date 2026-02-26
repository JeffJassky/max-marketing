import { BronzeImport } from "../../base";
import { z } from "zod";

export const instagramAccount = new BronzeImport({
  id: "instagramAccount",
  description: "Instagram account-level metrics including followers (snapshot) and daily reach.",
  platform: "instagram",
  endpoint: "instagram",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id"],
  uniquenessKey: ["date", "account_id"],
  params: {
    date_preset: "last_30d",
  },
  dimensions: {
    date: z.string(),
    account_id: z.string(),
    account_name: z.string(),
  },
  metrics: {
    followers_count: z.number(),
    follows_count: z.number(),
    follower_count_1d: z.number(),
    reach: z.number(),
  },
});
