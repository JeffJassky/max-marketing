import type { ThumbnailSyncConfig } from "../../shared/vendors/aws/thumbnailSync";

/**
 * Thumbnail sync configurations for creative/ads imports.
 * Each config maps an import table to its thumbnail fields and S3 platform prefix.
 */
export const creativeAdsThumbnailConfigs: ThumbnailSyncConfig[] = [
  {
    platform: "facebook_ads",
    importTable: "imports.facebook_ads_creative",
    mediaIdField: "creative_id",
    thumbnailUrlFields: ["thumbnail_url"],
    lookbackDays: 7,
  },
];
