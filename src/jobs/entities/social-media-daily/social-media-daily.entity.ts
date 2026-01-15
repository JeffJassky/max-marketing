import { Entity } from "../../base";
import { instagramMedia } from "../../imports/instagram/media.import";
import { facebookOrganicPosts } from "../../imports/facebook_organic/posts.import";
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
  description: "Daily organic performance for Instagram and Facebook posts.",
  sources: [instagramMedia, facebookOrganicPosts],
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
      },
    },
    media_id: {
      type: z.string(),
      sources: {
        instagramMedia: { sourceField: "media_id" },
        facebookOrganicPosts: { sourceField: "post_id" },
      },
    },
    media_type: {
      type: z.string(),
      sources: {
        instagramMedia: { sourceField: "media_type" },
        facebookOrganicPosts: { expression: "CAST(NULL AS STRING)" },
      },
    },
    caption: {
      type: z.string(),
      sources: {
        instagramMedia: { sourceField: "media_caption" },
        facebookOrganicPosts: { expression: "COALESCE(post_message, post_title, post_description)" },
      },
    },
    permalink: {
      type: z.string(),
      sources: {
        instagramMedia: { sourceField: "media_permalink" },
        facebookOrganicPosts: { expression: "CAST(NULL AS STRING)" },
      },
    },
    thumbnail_url: {
      type: z.string(),
      sources: {
        instagramMedia: { sourceField: "media_thumbnail_url" },
        facebookOrganicPosts: { sourceField: "post_picture" },
      },
    },
  },
  metrics: {
    impressions: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramMedia: { sourceField: "impressions" },
        facebookOrganicPosts: { sourceField: "post_impressions" },
      },
    },
    views: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramMedia: { sourceField: "media_views" },
        facebookOrganicPosts: { sourceField: "post_video_views" },
      },
    },
    likes: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramMedia: { sourceField: "media_like_count" },
        facebookOrganicPosts: { sourceField: "post_activity_by_action_type_like" },
      },
    },
    comments: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramMedia: { sourceField: "media_comments_count" },
        facebookOrganicPosts: { sourceField: "post_comments_total" },
      },
    },
    engagement: {
      type: z.number(),
      aggregation: "sum",
      sources: {
        instagramMedia: { sourceField: "media_engagement" },
        facebookOrganicPosts: { sourceField: "page_post_engagements" },
      },
    },
  },
  superlatives: [
    {
      dimensionId: "platform",
      dimensionLabel: "Platform",
      limit: 2,
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
