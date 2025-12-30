import { Entity, EntityDef } from "../../base";
import { googleAdsCampaignPerformance } from "../../imports/google_ads/campaign-performance.import";
import { googleAdsListingGroupPerformance } from "../../imports/google_ads/listing-group-performance.import";
import { z } from "zod";
import knex from "knex";

const qb = knex({ client: "mysql" });

export const pmaxDaily = new (class PMaxDailyEntity extends Entity<
  typeof googleAdsCampaignPerformance
> {
  constructor() {
    super({
      id: "pmaxDaily",
      description:
        "Daily PMax performance broken down by Shopping (Listing Group) vs Other channels.",
      source: googleAdsCampaignPerformance, // Primary source for base metadata
      partitionBy: "date",
      clusterBy: ["account_id", "campaign_id"],
      grain: ["date", "account_id", "campaign_id", "campaign"],
      dimensions: {
        date: { type: z.string(), sourceField: "date" },
        account_id: { type: z.string(), sourceField: "account_id" },
        campaign_id: { type: z.string(), sourceField: "campaign_id" },
        campaign: { type: z.string(), sourceField: "campaign" },
        ad_network_type: { type: z.string(), sourceField: "ad_network_type" },
        advertising_channel_type: {
          type: z.string(),
          sourceField: "advertising_channel_type",
        },
        advertising_channel_sub_type: {
          type: z.string(),
          sourceField: "advertising_channel_sub_type",
        },
      },
      metrics: {
        total_spend: {
          type: z.number(),
          aggregation: "sum",
          sourceField: "spend",
        },
        shopping_spend: {
          type: z.number(),
          aggregation: "sum",
          sourceField: "spend",
        },
        other_spend: {
          type: z.number(),
          aggregation: "sum",
          sourceField: "spend",
        },
        youtube_spend: {
          type: z.number(),
          aggregation: "sum",
          sourceField: "spend",
        },
        display_spend: {
          type: z.number(),
          aggregation: "sum",
          sourceField: "spend",
        },
        search_spend: {
          type: z.number(),
          aggregation: "sum",
          sourceField: "spend",
        },
        total_conversions: {
          type: z.number(),
          aggregation: "sum",
          sourceField: "conversions",
        },
        shopping_conversions: {
          type: z.number(),
          aggregation: "sum",
          sourceField: "conversions", // Placeholder
        },
      },
    });
  }

  // Override to perform the Join logic
  getTransformQuery(): string {
    const campaignTable = googleAdsCampaignPerformance.fqn;
    const listingTable = googleAdsListingGroupPerformance.fqn;

    return qb
      .select(
        "c.date",
        "c.account_id",
        "c.campaign_id",
        "c.campaign",
        "c.ad_network_type",
        qb.raw("SUM(c.spend) as total_spend"),
        qb.raw("COALESCE(SUM(l.shopping_spend), 0) as shopping_spend"),
        qb.raw(
          "SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0) as other_spend"
        ),
        qb.raw(`
          CASE 
            WHEN (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) <= 0 THEN 0
            ELSE 
              -- Calculate weights based on interaction density
              (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) * 
              SAFE_DIVIDE(
                SUM(c.video_views) * 0.05, -- Proxy $0.05 CPV
                (SUM(c.video_views) * 0.05) + (SUM(c.active_view_impressions) * 0.002) + ((SUM(c.clicks) - COALESCE(SUM(l.shopping_clicks), 0)) * 1.5)
              )
          END as youtube_spend
        `),
        qb.raw(`
          CASE 
            WHEN (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) <= 0 THEN 0
            ELSE 
              (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) * 
              SAFE_DIVIDE(
                SUM(c.active_view_impressions) * 0.002, -- Proxy $2.00 CPM
                (SUM(c.video_views) * 0.05) + (SUM(c.active_view_impressions) * 0.002) + ((SUM(c.clicks) - COALESCE(SUM(l.shopping_clicks), 0)) * 1.5)
              )
          END as display_spend
        `),
        qb.raw(`
          CASE 
            WHEN (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) <= 0 THEN 0
            WHEN ((SUM(c.video_views) * 0.05) + (SUM(c.active_view_impressions) * 0.002) + ((SUM(c.clicks) - COALESCE(SUM(l.shopping_clicks), 0)) * 1.5)) = 0 
              THEN (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) -- Default to search if no aggregateReports
            ELSE 
              (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) * 
              SAFE_DIVIDE(
                ((SUM(c.clicks) - COALESCE(SUM(l.shopping_clicks), 0)) * 1.5), -- Proxy $1.50 CPC
                (SUM(c.video_views) * 0.05) + (SUM(c.active_view_impressions) * 0.002) + ((SUM(c.clicks) - COALESCE(SUM(l.shopping_clicks), 0)) * 1.5)
              )
          END as search_spend
        `),
        qb.raw("SUM(c.conversions) as total_conversions"),
        qb.raw(
          "COALESCE(SUM(l.shopping_conversions), 0) as shopping_conversions"
        )
      )
      .from(`${campaignTable} as c`)
      .leftJoin(
        qb
          .select(
            "date",
            "campaign_id",
            qb.raw("SUM(spend) as shopping_spend"),
            qb.raw("SUM(clicks) as shopping_clicks"),
            qb.raw("SUM(conversions) as shopping_conversions")
          )
          .from(`${listingTable}`)
          .whereNotNull("offer_id") // Rows with offer_id represent product spend
          .groupBy("date", "campaign_id")
          .as("l"),
        function () {
          this.on("c.campaign_id", "=", "l.campaign_id").andOn(
            "c.date",
            "=",
            "l.date"
          );
        }
      )
      .whereRaw("UPPER(c.advertising_channel_type) = 'PERFORMANCE_MAX'")
      .groupBy(
        "c.date",
        "c.account_id",
        "c.campaign_id",
        "c.campaign",
        "c.ad_network_type"
      )
      .toQuery();
  }
})();
