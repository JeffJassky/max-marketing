import { Entity } from "../../base";
import { instagramMedia } from "../../imports/instagram/media.import";
import { facebookOrganicPosts } from "../../imports/facebook_organic/posts.import";
import { tiktokOrganicMedia } from "../../imports/tiktok_organic/media.import";
import { z } from "zod";
import {
  VolumeTitanAward,
  FirstPlaceAward,
  RocketShipAward,
  SteadyClimberAward,
  ConversationStarterAward,
} from "../../../shared/data/awards/library";

export const socialMediaDaily = new (class SocialMediaDailyEntity extends Entity<
  typeof instagramMedia
> {
  constructor() {
    super({
      id: "socialMediaDaily",
      label: "Social Media",
      description: "Daily organic performance for Instagram, Facebook, and TikTok posts.",
      sources: [instagramMedia, facebookOrganicPosts, tiktokOrganicMedia],
      partitionBy: "date",
      clusterBy: ["platform", "account_id", "media_type", "media_id"],
      grain: ["date", "account_id", "platform", "media_type", "media_id"],
      dimensions: {
        date: { type: z.string() },
        account_id: { type: z.string() },
        platform: {
          type: z.string(),
          sources: {
            instagramMedia: { expression: "'instagram'" },
            facebookOrganicPosts: { expression: "'facebook'" },
            tiktokOrganicMedia: { expression: "'tiktok'" },
          },
        },
        media_id: {
          type: z.string(),
          sources: {
            instagramMedia: { sourceField: "media_id" },
            facebookOrganicPosts: { sourceField: "post_id" },
            tiktokOrganicMedia: { sourceField: "video_id" },
          },
        },
        media_type: {
          type: z.string(),
          sources: {
            instagramMedia: { sourceField: "media_type" },
            facebookOrganicPosts: { expression: "'POST'" },
            tiktokOrganicMedia: { expression: "'VIDEO'" },
          },
        },
        caption: {
          type: z.string(),
          sources: {
            instagramMedia: { sourceField: "media_caption" },
            facebookOrganicPosts: { expression: "COALESCE(post_message, post_title, post_description)" },
            tiktokOrganicMedia: { sourceField: "video_caption" },
          },
        },
        permalink: {
          type: z.string(),
          sources: {
            instagramMedia: { sourceField: "media_permalink" },
            facebookOrganicPosts: { expression: "CONCAT('https://facebook.com/', post_id)" },
            tiktokOrganicMedia: { expression: "CAST(NULL AS STRING)" },
          },
        },
        published_at: {
          type: z.string(),
          sources: {
            instagramMedia: { sourceField: "published_date" },
            facebookOrganicPosts: { expression: "COALESCE(published_date, post_created_time)" },
            tiktokOrganicMedia: { expression: "COALESCE(published_date, video_create_datetime)" },
          },
        },
        thumbnail_url: {
          type: z.string(),
          sources: {
            instagramMedia: {
              expression: "COALESCE(media_thumbnail_url, media_url)",
            },
            facebookOrganicPosts: {
              expression: "COALESCE(full_picture, post_picture)",
            },
            tiktokOrganicMedia: { sourceField: "video_thumbnail_url" },
          },
        },
      },
      metrics: {
        impressions: {
          type: z.number(),
          aggregation: "max",
          sources: {
            instagramMedia: { expression: "MAX(COALESCE(impressions, media_reach, media_views))" },
            facebookOrganicPosts: { sourceField: "post_impressions" },
            tiktokOrganicMedia: { expression: "MAX(COALESCE(video_reach, video_views_count))" },
          },
        },
        views: {
          type: z.number(),
          aggregation: "max",
          sources: {
            instagramMedia: { sourceField: "media_views" },
            facebookOrganicPosts: { sourceField: "post_video_views" },
            tiktokOrganicMedia: { sourceField: "video_views_count" },
          },
        },
        likes: {
          type: z.number(),
          aggregation: "max",
          sources: {
            instagramMedia: { sourceField: "media_like_count" },
            facebookOrganicPosts: { sourceField: "post_activity_by_action_type_like" },
            tiktokOrganicMedia: { sourceField: "video_likes" },
          },
        },
        comments: {
          type: z.number(),
          aggregation: "max",
          sources: {
            instagramMedia: { sourceField: "media_comments_count" },
            facebookOrganicPosts: { sourceField: "post_comments_total" },
            tiktokOrganicMedia: { sourceField: "video_comments" },
          },
        },
        shares: {
          type: z.number(),
          aggregation: "max",
          sources: {
            instagramMedia: { sourceField: "media_shares" },
            facebookOrganicPosts: { expression: "0" },
            tiktokOrganicMedia: { sourceField: "video_shares" },
          },
        },
        engagement: {
          type: z.number(),
          aggregation: "max",
          sources: {
            instagramMedia: { sourceField: "media_engagement" },
            facebookOrganicPosts: { sourceField: "page_post_engagements" },
            tiktokOrganicMedia: { expression: "MAX(COALESCE(video_likes, 0) + COALESCE(video_comments, 0) + COALESCE(video_shares, 0))" },
          },
        },
        delta_impressions: { type: z.number(), aggregation: "sum" },
        delta_views: { type: z.number(), aggregation: "sum" },
        delta_likes: { type: z.number(), aggregation: "sum" },
        delta_comments: { type: z.number(), aggregation: "sum" },
        delta_shares: { type: z.number(), aggregation: "sum" },
        delta_engagement: { type: z.number(), aggregation: "sum" },
      },
      superlatives: [
        {
          dimensionId: "platform",
          dimensionLabel: "Platform",
          limit: 3,
          metrics: [
            { metric: "delta_impressions", awards: [VolumeTitanAward, FirstPlaceAward] },
            { metric: "delta_views", awards: [VolumeTitanAward] },
            { metric: "delta_likes", awards: [VolumeTitanAward] },
            { metric: "delta_comments", awards: [VolumeTitanAward] },
          ],
        },
        {
          dimensionId: "media_type",
          dimensionLabel: "Media Type",
          limit: 5,
          metrics: [
            { metric: "delta_impressions", awards: [VolumeTitanAward, FirstPlaceAward] },
            { metric: "delta_views", awards: [VolumeTitanAward] },
            { metric: "delta_likes", awards: [VolumeTitanAward] },
            { metric: "delta_comments", awards: [VolumeTitanAward] },
          ],
        },
        {
          dimensionId: "media_id",
          dimensionNameField: "caption",
          dimensionLabel: "Post",
          includeDimensions: ["thumbnail_url"],
          limit: 10,
          metrics: [
            {
              metric: "delta_impressions",
              awards: [VolumeTitanAward, FirstPlaceAward]
            },
            {
              metric: "delta_views",
              awards: [VolumeTitanAward]
            },
            {
              metric: "delta_likes",
              awards: [VolumeTitanAward, RocketShipAward]
            },
            {
              metric: "delta_comments",
              awards: [VolumeTitanAward, SteadyClimberAward, ConversationStarterAward]
            },
          ],
        },
      ],
    });
  }

  getTransformQuery(options?: { dateFilter?: string }): string {
    const dateFilter = options?.dateFilter;

    // Buffer for LAG computation: go back 7 days before the requested date filter
    const bufferDateFilter = dateFilter
      ? `DATE_SUB(${dateFilter}, INTERVAL 7 DAY)`
      : null;

    const instagramTable = instagramMedia.fqn;
    const facebookTable = facebookOrganicPosts.fqn;
    const tiktokTable = tiktokOrganicMedia.fqn;

    const instagramDateWhere = bufferDateFilter ? `\n            WHERE date >= ${bufferDateFilter}` : "";
    const facebookDateWhere = bufferDateFilter ? `\n            WHERE date >= ${bufferDateFilter}` : "";
    const tiktokDateWhere = bufferDateFilter ? `\n            WHERE date >= ${bufferDateFilter}` : "";

    const finalDateWhere = dateFilter ? `\nWHERE date >= ${dateFilter}` : "";

    return `
WITH raw_lifetime AS (
  -- Instagram
  SELECT
    date,
    account_id,
    'instagram' AS platform,
    media_id AS media_id,
    ANY_VALUE(media_type) AS media_type,
    ANY_VALUE(media_caption) AS caption,
    ANY_VALUE(media_permalink) AS permalink,
    ANY_VALUE(published_date) AS published_at,
    ANY_VALUE(COALESCE(media_thumbnail_url, media_url)) AS thumbnail_url,
    COALESCE(MAX(COALESCE(impressions, media_reach, media_views)), 0) AS impressions,
    COALESCE(MAX(SAFE_CAST(media_views AS FLOAT64)), 0) AS views,
    COALESCE(MAX(SAFE_CAST(media_like_count AS FLOAT64)), 0) AS likes,
    COALESCE(MAX(SAFE_CAST(media_comments_count AS FLOAT64)), 0) AS comments,
    COALESCE(MAX(SAFE_CAST(media_shares AS FLOAT64)), 0) AS shares,
    COALESCE(MAX(SAFE_CAST(media_engagement AS FLOAT64)), 0) AS engagement
  FROM (
    SELECT * EXCEPT(rn) FROM (
      SELECT *, ROW_NUMBER() OVER(PARTITION BY date, account_id, media_id ORDER BY (SELECT NULL)) AS rn
      FROM \`${instagramTable}\`${instagramDateWhere}
    ) WHERE rn = 1
  )
  GROUP BY date, account_id, media_id

  UNION ALL

  -- Facebook
  SELECT
    date,
    account_id,
    'facebook' AS platform,
    post_id AS media_id,
    'POST' AS media_type,
    ANY_VALUE(COALESCE(post_message, post_title, post_description)) AS caption,
    ANY_VALUE(CONCAT('https://facebook.com/', post_id)) AS permalink,
    ANY_VALUE(COALESCE(published_date, post_created_time)) AS published_at,
    ANY_VALUE(COALESCE(full_picture, post_picture)) AS thumbnail_url,
    COALESCE(MAX(SAFE_CAST(post_impressions AS FLOAT64)), 0) AS impressions,
    COALESCE(MAX(SAFE_CAST(post_video_views AS FLOAT64)), 0) AS views,
    COALESCE(MAX(SAFE_CAST(post_activity_by_action_type_like AS FLOAT64)), 0) AS likes,
    COALESCE(MAX(SAFE_CAST(post_comments_total AS FLOAT64)), 0) AS comments,
    0 AS shares,
    COALESCE(MAX(SAFE_CAST(page_post_engagements AS FLOAT64)), 0) AS engagement
  FROM (
    SELECT * EXCEPT(rn) FROM (
      SELECT *, ROW_NUMBER() OVER(PARTITION BY date, account_id, post_id ORDER BY (SELECT NULL)) AS rn
      FROM \`${facebookTable}\`${facebookDateWhere}
    ) WHERE rn = 1
  )
  GROUP BY date, account_id, post_id

  UNION ALL

  -- TikTok
  SELECT
    date,
    account_id,
    'tiktok' AS platform,
    video_id AS media_id,
    'VIDEO' AS media_type,
    ANY_VALUE(video_caption) AS caption,
    CAST(NULL AS STRING) AS permalink,
    ANY_VALUE(COALESCE(published_date, video_create_datetime)) AS published_at,
    ANY_VALUE(video_thumbnail_url) AS thumbnail_url,
    COALESCE(MAX(COALESCE(SAFE_CAST(video_reach AS FLOAT64), SAFE_CAST(video_views_count AS FLOAT64))), 0) AS impressions,
    COALESCE(MAX(SAFE_CAST(video_views_count AS FLOAT64)), 0) AS views,
    COALESCE(MAX(SAFE_CAST(video_likes AS FLOAT64)), 0) AS likes,
    COALESCE(MAX(SAFE_CAST(video_comments AS FLOAT64)), 0) AS comments,
    COALESCE(MAX(SAFE_CAST(video_shares AS FLOAT64)), 0) AS shares,
    COALESCE(MAX(COALESCE(SAFE_CAST(video_likes AS FLOAT64), 0) + COALESCE(SAFE_CAST(video_comments AS FLOAT64), 0) + COALESCE(SAFE_CAST(video_shares AS FLOAT64), 0)), 0) AS engagement
  FROM (
    SELECT * EXCEPT(rn) FROM (
      SELECT *, ROW_NUMBER() OVER(PARTITION BY date, account_id, video_id ORDER BY (SELECT NULL)) AS rn
      FROM \`${tiktokTable}\`${tiktokDateWhere}
    ) WHERE rn = 1
  )
  GROUP BY date, account_id, video_id
),
with_deltas AS (
  SELECT *,
    impressions - COALESCE(LAG(impressions) OVER (PARTITION BY account_id, platform, media_id ORDER BY date), impressions) AS delta_impressions,
    views - COALESCE(LAG(views) OVER (PARTITION BY account_id, platform, media_id ORDER BY date), views) AS delta_views,
    likes - COALESCE(LAG(likes) OVER (PARTITION BY account_id, platform, media_id ORDER BY date), likes) AS delta_likes,
    comments - COALESCE(LAG(comments) OVER (PARTITION BY account_id, platform, media_id ORDER BY date), comments) AS delta_comments,
    shares - COALESCE(LAG(shares) OVER (PARTITION BY account_id, platform, media_id ORDER BY date), shares) AS delta_shares,
    engagement - COALESCE(LAG(engagement) OVER (PARTITION BY account_id, platform, media_id ORDER BY date), engagement) AS delta_engagement
  FROM raw_lifetime
)
SELECT
  date, account_id, platform, media_id, media_type,
  caption, permalink, published_at, thumbnail_url,
  impressions, views, likes, comments, shares, engagement,
  GREATEST(delta_impressions, 0) AS delta_impressions,
  GREATEST(delta_views, 0) AS delta_views,
  GREATEST(delta_likes, 0) AS delta_likes,
  GREATEST(delta_comments, 0) AS delta_comments,
  GREATEST(delta_shares, 0) AS delta_shares,
  GREATEST(delta_engagement, 0) AS delta_engagement
FROM with_deltas${finalDateWhere}
`;
  }
})();
