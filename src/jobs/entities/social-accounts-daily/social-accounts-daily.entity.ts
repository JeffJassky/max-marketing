import { Entity } from "../../base";
import { instagramAccount } from "../../imports/instagram/account.import";
import { facebookOrganicAccount } from "../../imports/facebook_organic/account.import";
import { z } from "zod";

export const socialAccountsDaily = new Entity({
  id: "socialAccountsDaily",
  label: "Social Accounts",
  description: "Daily account-level metrics for Instagram and Facebook, including followers and page impressions.",
  sources: [instagramAccount, facebookOrganicAccount],
  partitionBy: "date",
  clusterBy: ["platform", "account_id"],
  grain: ["date", "account_id", "platform"],
  dimensions: {
    date: { type: z.string() },
    account_id: { type: z.string() },
    platform: {
      type: z.string(),
      sources: {
        instagramAccount: { expression: "'instagram'" },
        facebookOrganicAccount: { expression: "'facebook'" },
      },
    },
  },
  metrics: {
    followers: {
      type: z.number(),
      aggregation: "max",
      sources: {
        instagramAccount: { sourceField: "followers_count" },
        facebookOrganicAccount: { sourceField: "page_fans" },
      },
    },
    follower_adds: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramAccount: { sourceField: "follower_count_1d" },
        facebookOrganicAccount: { sourceField: "page_fan_adds" },
      },
    },
    follower_removes: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramAccount: { expression: "0" },
        facebookOrganicAccount: { sourceField: "page_fan_removes" },
      },
    },
    reach: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramAccount: { sourceField: "reach" },
        facebookOrganicAccount: { sourceField: "page_impressions" },
      },
    },
    profile_views: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramAccount: { expression: "0" },
        facebookOrganicAccount: { sourceField: "page_views_total" },
      },
    },
    engaged_users: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramAccount: { expression: "0" },
        facebookOrganicAccount: { sourceField: "page_engaged_users" },
      },
    },
  },
});
