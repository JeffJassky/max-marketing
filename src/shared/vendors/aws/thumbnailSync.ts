import chalk from "chalk";
import { createBigQueryClient } from "../google/bigquery/bigquery";
import {
  createS3Client,
  listExistingKeys,
  streamUrlToS3,
  getThumbnailS3Key,
} from "./s3";

export interface ThumbnailEntityUpdate {
  /** Fully qualified BigQuery entity table (e.g., "entities.social_media_daily") */
  table: string;
  /** Column name for the media identifier in the entity table */
  mediaIdField: string;
  /** Value to match against the entity's `platform` column */
  platformFilter: string;
}

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
  /** Entity table to update with confirmed S3 URLs after upload */
  entityUpdate?: ThumbnailEntityUpdate;
}

export interface ThumbnailSyncResult {
  checked: number;
  uploaded: number;
  skipped: number;
  failed: number;
  entityUpdated: number;
}

/**
 * Sync thumbnails from BigQuery import tables to S3, then update entity tables
 * with confirmed S3 URLs so only successfully-uploaded thumbnails use S3 paths.
 *
 * 1. Query BigQuery for distinct (media_id, thumbnail_url) from recent imports
 * 2. List existing S3 keys under the platform prefix (batch efficient)
 * 3. Stream-upload only missing thumbnails from source URL -> S3
 * 4. Batch UPDATE the entity table with S3 URLs for all confirmed keys
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
    entityUpdated: 0,
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
  } else {
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
          // Add to existingKeys so the entity update includes newly uploaded ones
          existingKeys.add(item.s3Key);
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
  }

  // 5. Batch UPDATE entity table with S3 URLs for all confirmed S3 keys
  if (config.entityUpdate && existingKeys.size > 0) {
    result.entityUpdated = await updateEntityThumbnails(
      bq,
      projectId!,
      config.platform,
      config.entityUpdate,
      existingKeys
    );
  }

  return result;
}

/**
 * Batch UPDATE the entity table to set thumbnail_url to the confirmed S3 URL
 * for all media IDs that have successfully been uploaded to S3.
 * Processes in chunks to stay within BigQuery query size limits.
 */
async function updateEntityThumbnails(
  bq: ReturnType<typeof createBigQueryClient>,
  projectId: string,
  platform: string,
  entityUpdate: ThumbnailEntityUpdate,
  existingKeys: Set<string>,
): Promise<number> {
  // Use proxy route prefix so the server authenticates S3 requests on behalf of the client
  const proxyPrefix = "/api/thumbnails";

  // Extract media IDs from S3 keys (format: thumbnails/{platform}/{mediaId}.jpg)
  const prefix = `thumbnails/${platform}/`;
  const mediaIds: string[] = [];
  for (const key of existingKeys) {
    if (key.startsWith(prefix)) {
      const id = key.slice(prefix.length).replace(/\.jpg$/, "");
      if (id) mediaIds.push(id);
    }
  }

  if (mediaIds.length === 0) return 0;

  const BATCH_SIZE = 500;
  let totalUpdated = 0;

  for (let i = 0; i < mediaIds.length; i += BATCH_SIZE) {
    const batch = mediaIds.slice(i, i + BATCH_SIZE);
    const idList = batch.map((id) => `'${id.replace(/'/g, "\\'")}'`).join(", ");

    const updateQuery = `
      UPDATE \`${projectId}.${entityUpdate.table}\`
      SET thumbnail_url = CONCAT('${proxyPrefix}/${platform}/', ${entityUpdate.mediaIdField}, '.jpg')
      WHERE ${entityUpdate.mediaIdField} IN (${idList})
        AND platform = '${entityUpdate.platformFilter}'
        AND (thumbnail_url IS NULL
          OR NOT STARTS_WITH(thumbnail_url, '${proxyPrefix}/'))
    `;

    try {
      const [job] = await bq.createQueryJob({ query: updateQuery });
      await job.getQueryResults();
      const [metadata] = await job.getMetadata();
      const rowsAffected = parseInt(
        metadata?.statistics?.query?.numDmlAffectedRows ?? "0",
        10
      );
      totalUpdated += rowsAffected;
    } catch (err: any) {
      console.log(
        chalk.yellow(
          `  [thumbnail] ${platform}: entity update batch failed - ${err.message}`
        )
      );
    }
  }

  if (totalUpdated > 0) {
    console.log(
      chalk.green(
        `  [thumbnail] ${platform}: updated ${totalUpdated} entity rows with S3 URLs`
      )
    );
  }

  return totalUpdated;
}
