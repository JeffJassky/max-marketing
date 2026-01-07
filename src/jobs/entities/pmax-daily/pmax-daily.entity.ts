import { Entity } from "../../base";
import { googleAdsCampaignPerformance } from "../../imports/google_ads/campaign-performance.import";
import { googleAdsListingGroupPerformance } from "../../imports/google_ads/listing-group-performance.import";
import { z } from "zod";
import knex from "knex";
import {
  VolumeTitanAward,
  RocketShipAward,
  EfficiencyKingAward,
  DominatorAward,
} from "../../../shared/data/awards/library";

const qb = knex({ client: "pg" });

export const pmaxDaily = new (class PMaxDailyEntity extends Entity<
  typeof googleAdsCampaignPerformance
> {
  constructor() {
    super({
      id: "pmaxDaily",
      label: "Performance Max Breakdown",
      description:
        "Daily PMax performance with dynamic account-level benchmarking for Search/Video/Display splits.",
      sources: [googleAdsCampaignPerformance, googleAdsListingGroupPerformance],
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
        total_sales_volume: {
          type: z.number(),
          aggregation: "sum",
          sourceField: "conversions_value",
        },
      },
      superlatives: [
        {
          dimensionId: "campaign_id",
          dimensionNameField: "campaign",
          dimensionLabel: "Campaign",
          metrics: [
            {
              metric: "total_conversions",
              awards: [VolumeTitanAward, RocketShipAward],
            },
            { metric: "total_sales_volume" },
            {
              metric: "roas",
              expression:
                "CASE WHEN SUM(total_spend) > 50 THEN SAFE_DIVIDE(SUM(total_sales_volume), SUM(total_spend)) ELSE 0 END",
              awards: [EfficiencyKingAward, DominatorAward],
            },
          ],
        },
        {
          dimensionId: "ad_network_type",
          dimensionLabel: "Network",
          metrics: [
            {
              metric: "total_conversions",
              awards: [VolumeTitanAward],
            },
            { metric: "total_sales_volume" },
            {
              metric: "roas",
              expression:
                "CASE WHEN SUM(total_spend) > 100 THEN SAFE_DIVIDE(SUM(total_sales_volume), SUM(total_spend)) ELSE 0 END",
              awards: [EfficiencyKingAward],
            },
          ],
        },
      ],
    });
  }

  getTransformQuery(): string {
    const campaignTable = googleAdsCampaignPerformance.fqn;
    const listingTable = googleAdsListingGroupPerformance.fqn;

    return `
      WITH 
      -- Step 1: Calculate account-level benchmarks from standard campaigns
      -- We look at the last 30 days of data to find the REAL cost of Search vs Display vs Video
      benchmarks AS (
        SELECT 
          account_id,
          -- Average CPC for Search
          COALESCE(SAFE_DIVIDE(SUM(CASE WHEN advertising_channel_type = 'SEARCH' THEN spend END), SUM(CASE WHEN advertising_channel_type = 'SEARCH' THEN clicks END)), 1.50) as avg_search_cpc,
          -- Average CPV for YouTube
          COALESCE(SAFE_DIVIDE(SUM(CASE WHEN advertising_channel_type = 'VIDEO' THEN spend END), SUM(CASE WHEN advertising_channel_type = 'VIDEO' THEN video_views END)), 0.05) as avg_video_cpv,
          -- Average CPM for Display
          COALESCE(SAFE_DIVIDE(SUM(CASE WHEN advertising_channel_type = 'DISPLAY' THEN spend END), SUM(CASE WHEN advertising_channel_type = 'DISPLAY' THEN impressions END)) * 1000, 2.00) as avg_display_cpm
        FROM \`${campaignTable}\`
        WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        GROUP BY 1
      ),

      -- Step 2: Extract verified Shopping spend from Listing Groups
      listing_spend AS (
        SELECT 
          date, 
          campaign_id, 
          SUM(spend) as shopping_spend,
          SUM(clicks) as shopping_clicks,
          SUM(conversions) as shopping_conversions
        FROM \`${listingTable}\`
        WHERE offer_id IS NOT NULL
        GROUP BY 1, 2
      )

      -- Step 3: Final Join and Weighted Split
      SELECT 
        c.date,
        c.account_id,
        c.campaign_id,
        c.campaign,
        c.ad_network_type,
        SUM(c.spend) as total_spend,
        COALESCE(SUM(l.shopping_spend), 0) as shopping_spend,
        
        -- Remaining spend to be allocated
        GREATEST(SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0), 0) as other_spend,

        -- Allocated YouTube Spend
        CASE 
          WHEN (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) <= 0 THEN 0
          ELSE 
            (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) * 
            SAFE_DIVIDE(
              SUM(c.video_views) * b.avg_video_cpv,
              (SUM(c.video_views) * b.avg_video_cpv) + (SUM(c.active_view_impressions) * (b.avg_display_cpm / 1000)) + ((SUM(c.clicks) - COALESCE(SUM(l.shopping_clicks), 0)) * b.avg_search_cpc)
            )
        END as youtube_spend,

        -- Allocated Display Spend
        CASE 
          WHEN (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) <= 0 THEN 0
          ELSE 
            (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) * 
            SAFE_DIVIDE(
              SUM(c.active_view_impressions) * (b.avg_display_cpm / 1000),
              (SUM(c.video_views) * b.avg_video_cpv) + (SUM(c.active_view_impressions) * (b.avg_display_cpm / 1000)) + ((SUM(c.clicks) - COALESCE(SUM(l.shopping_clicks), 0)) * b.avg_search_cpc)
            )
        END as display_spend,

        -- Allocated Search Spend (The residual or weighted portion)
        CASE 
          WHEN (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) <= 0 THEN 0
          WHEN ((SUM(c.video_views) * b.avg_video_cpv) + (SUM(c.active_view_impressions) * (b.avg_display_cpm / 1000)) + ((SUM(c.clicks) - COALESCE(SUM(l.shopping_clicks), 0)) * b.avg_search_cpc)) = 0 
            THEN (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0))
          ELSE 
            (SUM(c.spend) - COALESCE(SUM(l.shopping_spend), 0)) * 
            SAFE_DIVIDE(
              ((SUM(c.clicks) - COALESCE(SUM(l.shopping_clicks), 0)) * b.avg_search_cpc),
              (SUM(c.video_views) * b.avg_video_cpv) + (SUM(c.active_view_impressions) * (b.avg_display_cpm / 1000)) + ((SUM(c.clicks) - COALESCE(SUM(l.shopping_clicks), 0)) * b.avg_search_cpc)
            )
        END as search_spend,

        SUM(c.conversions) as total_conversions,
        SUM(c.conversions_value) as total_sales_volume

      FROM \`${campaignTable}\` as c
      LEFT JOIN listing_spend as l ON c.campaign_id = l.campaign_id AND c.date = l.date
      LEFT JOIN benchmarks as b ON c.account_id = b.account_id
      WHERE UPPER(c.advertising_channel_type) = 'PERFORMANCE_MAX'
      GROUP BY 1, 2, 3, 4, 5, b.avg_video_cpv, b.avg_display_cpm, b.avg_search_cpc
    `;
  }
})();
