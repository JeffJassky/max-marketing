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

export const socialMediaDaily = new Entity({
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
        tiktokOrganicMedia: { sourceField: "video_share_url" },
      },
    },
    published_at: {
      type: z.string(),
      sources: {
        instagramMedia: { expression: "CAST(date AS STRING)" },
        facebookOrganicPosts: { sourceField: "post_created_time" },
        tiktokOrganicMedia: { sourceField: "video_create_datetime" },
      },
    },
    thumbnail_url: {
      type: z.string(),
      sources: {
        instagramMedia: {
          expression: process.env.S3_PUBLIC_URL
            ? `CASE WHEN media_id IS NOT NULL THEN CONCAT('${process.env.S3_PUBLIC_URL}/thumbnails/instagram/', media_id, '.jpg') ELSE COALESCE(media_thumbnail_url, media_url) END`
            : "COALESCE(media_thumbnail_url, media_url)",
        },
        facebookOrganicPosts: {
          expression: process.env.S3_PUBLIC_URL
            ? `CASE WHEN post_id IS NOT NULL THEN CONCAT('${process.env.S3_PUBLIC_URL}/thumbnails/facebook_organic/', post_id, '.jpg') ELSE COALESCE(full_picture, post_picture) END`
            : "COALESCE(full_picture, post_picture)",
        },
        tiktokOrganicMedia: { sourceField: "video_thumbnail_url" },
      },
    },
  },
  metrics: {
    impressions: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramMedia: { expression: "SUM(COALESCE(impressions, media_reach, media_views))" },
        facebookOrganicPosts: { sourceField: "post_impressions" },
        tiktokOrganicMedia: { expression: "SUM(COALESCE(video_reach, video_views_count))" },
      },
    },
    views: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramMedia: { sourceField: "media_views" },
        facebookOrganicPosts: { sourceField: "post_video_views" },
        tiktokOrganicMedia: { sourceField: "video_views_count" },
      },
    },
    likes: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramMedia: { sourceField: "media_like_count" },
        facebookOrganicPosts: { sourceField: "post_activity_by_action_type_like" },
        tiktokOrganicMedia: { sourceField: "video_likes" },
      },
    },
    comments: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramMedia: { sourceField: "media_comments_count" },
        facebookOrganicPosts: { sourceField: "post_comments_total" },
        tiktokOrganicMedia: { sourceField: "video_comments" },
      },
    },
    shares: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramMedia: { sourceField: "media_shares" },
        facebookOrganicPosts: { expression: "0" },
        tiktokOrganicMedia: { sourceField: "video_shares" },
      },
    },
    engagement: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramMedia: { sourceField: "media_engagement" },
        facebookOrganicPosts: { sourceField: "page_post_engagements" },
        tiktokOrganicMedia: { expression: "SUM(COALESCE(video_likes, 0) + COALESCE(video_comments, 0) + COALESCE(video_shares, 0) + COALESCE(video_favorites, 0))" },
      },
    },
  },
  superlatives: [
    {
      dimensionId: "platform",
      dimensionLabel: "Platform",
      limit: 3,
      metrics: [
        { metric: "impressions", awards: [VolumeTitanAward, FirstPlaceAward] },
        { metric: "views", awards: [VolumeTitanAward] },
        { metric: "likes", awards: [VolumeTitanAward] },
        { metric: "comments", awards: [VolumeTitanAward] },
      ],
    },
    {
      dimensionId: "media_type",
      dimensionLabel: "Media Type",
      limit: 5,
      metrics: [
        { metric: "impressions", awards: [VolumeTitanAward, FirstPlaceAward] },
        { metric: "views", awards: [VolumeTitanAward] },
        { metric: "likes", awards: [VolumeTitanAward] },
        { metric: "comments", awards: [VolumeTitanAward] },
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
          metric: "impressions", 
          awards: [VolumeTitanAward, FirstPlaceAward] 
        },
        { 
          metric: "views", 
          awards: [VolumeTitanAward] 
        },
        { 
          metric: "likes", 
          awards: [VolumeTitanAward, RocketShipAward] 
        },
        { 
          metric: "comments", 
          awards: [VolumeTitanAward, SteadyClimberAward, ConversationStarterAward] 
        },
      ],
    },
  ],
});
