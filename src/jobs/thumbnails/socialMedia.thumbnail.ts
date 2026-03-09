import type { ThumbnailSyncConfig } from "../../shared/vendors/aws/thumbnailSync";

/**
 * Thumbnail sync configurations for social media imports.
 * Each config maps an import table to its thumbnail fields and S3 platform prefix.
 */
export const socialMediaThumbnailConfigs: ThumbnailSyncConfig[] = [
  {
    platform: "instagram",
    importTable: "imports.instagram_media",
    mediaIdField: "media_id",
    thumbnailUrlFields: ["media_thumbnail_url", "media_url"],
    lookbackDays: 7,
  },
  {
    platform: "facebook_organic",
    importTable: "imports.facebook_organic_posts",
    mediaIdField: "post_id",
    thumbnailUrlFields: ["full_picture", "post_picture"],
    lookbackDays: 7,
  },
];
