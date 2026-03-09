import chalk from "chalk";
import { createBigQueryClient } from "../google/bigquery/bigquery";
import {
  createS3Client,
  listExistingKeys,
  streamUrlToS3,
  getThumbnailS3Key,
} from "./s3";

export interface ThumbnailSyncConfig {
  /** Platform identifier used in S3 key path (e.g., "instagram", "facebook_organic") */
  platform: string;
  /** Fully qualified BigQuery import table (e.g., "imports.instagram_media") */
  importTable: string;
  /** Column name for the media identifier */
  mediaIdField: string;
  /** Column names to COALESCE for the thumbnail URL (in priority order) */
  thumbnailUrlFields: string[];
  /** Number of days to look back for recent imports */
  lookbackDays: number;
}

export interface ThumbnailSyncResult {
  checked: number;
  uploaded: number;
  skipped: number;
  failed: number;
}

/**
 * Sync thumbnails from BigQuery import tables to S3.
 *
 * 1. Query BigQuery for distinct (media_id, thumbnail_url) from recent imports
 * 2. List existing S3 keys under the platform prefix (batch efficient)
 * 3. Stream-upload only missing thumbnails from source URL -> S3
 */
export async function syncThumbnails(
  config: ThumbnailSyncConfig
): Promise<ThumbnailSyncResult> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error("S3_BUCKET is not configured");
  }

  const result: ThumbnailSyncResult = {
    checked: 0,
    uploaded: 0,
    skipped: 0,
    failed: 0,
  };

  // 1. Query BigQuery for recent thumbnails
  const bq = createBigQueryClient();
  const projectId = process.env.BIGQUERY_PROJECT;
  const coalesceExpr = config.thumbnailUrlFields
    .map((f) => f)
    .join(", ");

  const query = `
    SELECT DISTINCT
      ${config.mediaIdField} AS media_id,
      COALESCE(${coalesceExpr}) AS thumbnail_url
    FROM \`${projectId}.${config.importTable}\`
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${config.lookbackDays} DAY)
      AND COALESCE(${coalesceExpr}) IS NOT NULL
      AND ${config.mediaIdField} IS NOT NULL
  `;

  const [rows] = await bq.query({ query });

  if (!rows || rows.length === 0) {
    console.log(
      chalk.gray(
        `  [thumbnail] ${config.platform}: no thumbnails found in last ${config.lookbackDays} days`
      )
    );
    return result;
  }

  result.checked = rows.length;

  // 2. List existing S3 keys under this platform prefix
  const s3 = createS3Client();
  const prefix = `thumbnails/${config.platform}/`;
  const existingKeys = await listExistingKeys(s3, bucket, prefix);

  // 3. Filter to only new thumbnails
  const toUpload: Array<{ mediaId: string; url: string; s3Key: string }> = [];

  for (const row of rows) {
    const mediaId = String(row.media_id);
    const url = String(row.thumbnail_url);
    const s3Key = getThumbnailS3Key(config.platform, mediaId);

    if (existingKeys.has(s3Key)) {
      result.skipped++;
      continue;
    }

    toUpload.push({ mediaId, url, s3Key });
  }

  if (toUpload.length === 0) {
    console.log(
      chalk.gray(
        `  [thumbnail] ${config.platform}: all ${result.checked} thumbnails already on S3`
      )
    );
    return result;
  }

  // 4. Upload with concurrency limit
  const CONCURRENCY = 5;
  const queue = [...toUpload];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      try {
        await streamUrlToS3(s3, item.url, bucket!, item.s3Key);
        result.uploaded++;
      } catch (err: any) {
        result.failed++;
        console.log(
          chalk.yellow(
            `  [thumbnail] ${config.platform}/${item.mediaId}: upload failed - ${err.message}`
          )
        );
      }
    }
  }

  // Launch concurrent workers
  const workers = Array.from({ length: Math.min(CONCURRENCY, toUpload.length) }, () =>
    worker()
  );
  await Promise.all(workers);

  return result;
}
