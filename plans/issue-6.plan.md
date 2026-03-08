# Implementation Plan: Self-Host Social Media Thumbnails on S3

**Issue:** [#6 — Self-host social media thumbnails after importing](https://github.com/JeffJassky/max-marketing/issues/6)
**Branch:** `agent/issue-6`

---

## Summary

Social media platforms (Instagram, Facebook, TikTok) provide thumbnail URLs with time-restricted tokens. These URLs expire after days/weeks, resulting in broken images when displayed in the dashboard later. We need to copy thumbnails to S3 immediately after import and derive the S3 URL deterministically from existing data (`platform` + `media_id`) so we **never need to update BigQuery rows** with new URLs.

---

## Current Architecture

### Thumbnail URL Fields in Imports (Bronze Layer)

| Import | Fields | BigQuery Table |
|--------|--------|----------------|
| `instagramMedia` | `media_thumbnail_url`, `media_url` | `imports.instagram_media` |
| `facebookOrganicPosts` | `full_picture`, `post_picture` | `imports.facebook_organic_posts` |
| `facebookAdsCreative` | `thumbnail_url` | `imports.facebook_ads_creative` |

### Thumbnail URL Fields in Entities (Silver Layer)

| Entity | Expression |
|--------|-----------|
| `socialMediaDaily` | `COALESCE(media_thumbnail_url, media_url)` (IG), `COALESCE(full_picture, post_picture)` (FB) |
| `creativeDaily` | `thumbnail_url` (FB Ads), `NULL` (Google) |

### Data Flow

```
Windsor API → WindsorImportExecutor → BigQuery (Bronze)
                                         ↓
                                  EntityExecutor → BigQuery (Silver)
                                         ↓
                                  SuperlativeExecutor (includes thumbnail_url)
```

### Pipeline Schedule

- **Daily at 6:00 AM UTC** via BullMQ
- Phases: `import → entity → aggregateReport → monitor → superlative`
- 7-day lookback window

---

## Design Decisions

### 1. Deterministic S3 Key (No DB Updates Needed)

Instead of updating BigQuery rows with new S3 URLs (expensive writes), we derive the S3 path deterministically:

```
s3://{BUCKET}/{platform}/{media_id}.jpg
```

Examples:
- `s3://maxmarketing-thumbnails/instagram/17890012345678.jpg`
- `s3://maxmarketing-thumbnails/facebook_organic/pfbid02abc123.jpg`
- `s3://maxmarketing-thumbnails/facebook_ads/creative_123456.jpg`

The entity layer constructs the self-hosted URL via a SQL expression rather than storing it, so **zero BigQuery update queries** are needed.

### 2. New Pipeline Phase: `thumbnail`

Add a `thumbnail` phase that runs **after `import`** and **before `entity`**. This phase:
1. Queries BigQuery for recently imported rows that have thumbnail URLs
2. Checks which thumbnails already exist on S3 (batch `HeadObject` or list prefix)
3. Streams only **new** thumbnails from source URL → S3 (no local disk)
4. Uses streaming upload to minimize memory/disk usage

### 3. Efficient "Only Once" Guarantee

- S3 key is deterministic — if the object already exists, skip it
- Use `HeadObject` (or batch `ListObjectsV2` by prefix) to check existence before uploading
- Only process rows from the current import lookback window (7 days), not the full history

---

## Affected Files and Modules

### New Files

| File | Purpose |
|------|---------|
| `src/shared/vendors/aws/s3.ts` | S3 client factory + helper functions (upload stream, check existence, get public URL) |
| `src/shared/vendors/aws/thumbnailSync.ts` | Core logic: query BQ for new thumbnails, check S3, stream-upload missing ones |
| `src/jobs/thumbnails/socialMedia.thumbnail.ts` | Thumbnail sync job definition for social media imports |
| `src/jobs/thumbnails/creativeAds.thumbnail.ts` | Thumbnail sync job definition for creative/ads imports |

### Modified Files

| File | Change |
|------|--------|
| `src/server/config.ts` | Add S3 env vars (`S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`) |
| `src/queue/types.ts` | Add `"thumbnail"` to the pipeline phase union type |
| `src/queue/pipeline.ts` | Add thumbnail phase execution between `import` and `entity` |
| `src/queue/worker.ts` | Include `"thumbnail"` in the `full` pipeline phase list |
| `src/jobs/entities/social-media-daily/social-media-daily.entity.ts` | Change `thumbnail_url` expressions to derive S3 URL |
| `src/jobs/entities/creative-daily/creative-daily.entity.ts` | Change `thumbnail_url` expression to derive S3 URL |
| `package.json` | Add `@aws-sdk/client-s3` dependency |

---

## Step-by-Step Implementation

### Step 1: Add AWS S3 Dependencies

```bash
yarn add @aws-sdk/client-s3
```

### Step 2: Add S3 Environment Variables

**File: `src/server/config.ts`**

Add to the Zod env schema:
```typescript
// S3 Thumbnail Storage (optional — thumbnails degrade gracefully to original URLs)
S3_BUCKET: z.string().optional(),
S3_REGION: z.string().default("us-east-1"),
S3_PUBLIC_URL: z.string().optional(), // e.g., "https://maxmarketing-thumbnails.s3.amazonaws.com"
AWS_ACCESS_KEY_ID: z.string().optional(),
AWS_SECRET_ACCESS_KEY: z.string().optional(),
```

All optional so the system still works without S3 configured (graceful degradation).

### Step 3: Create S3 Client Module

**File: `src/shared/vendors/aws/s3.ts`**

```typescript
import { S3Client, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

// S3 client factory
export function createS3Client(): S3Client { ... }

// Check if an object exists
export async function objectExists(bucket: string, key: string): Promise<boolean> { ... }

// Batch check existence via ListObjectsV2 (more efficient for many keys with shared prefix)
export async function listExistingKeys(bucket: string, prefix: string): Promise<Set<string>> { ... }

// Stream from URL directly to S3 (no local disk)
export async function streamUrlToS3(sourceUrl: string, bucket: string, key: string): Promise<void> { ... }

// Derive the deterministic S3 key
export function getThumbnailS3Key(platform: string, mediaId: string): string {
  return `thumbnails/${platform}/${mediaId}.jpg`;
}

// Derive the public URL
export function getThumbnailPublicUrl(platform: string, mediaId: string): string {
  const baseUrl = process.env.S3_PUBLIC_URL;
  return `${baseUrl}/thumbnails/${platform}/${mediaId}.jpg`;
}
```

The `streamUrlToS3` function uses `fetch()` to get a readable stream from the source URL and pipes it directly to S3 via `Upload` from `@aws-sdk/lib-storage` — no intermediate file on disk.

### Step 4: Create Thumbnail Sync Logic

**File: `src/shared/vendors/aws/thumbnailSync.ts`**

```typescript
export interface ThumbnailSyncConfig {
  platform: string;
  importTable: string;          // e.g., "imports.instagram_media"
  mediaIdField: string;         // e.g., "media_id"
  thumbnailUrlFields: string[]; // e.g., ["media_thumbnail_url", "media_url"]
  lookbackDays: number;
}

export async function syncThumbnails(config: ThumbnailSyncConfig): Promise<{
  checked: number;
  uploaded: number;
  skipped: number;
  failed: number;
}> {
  // 1. Query BigQuery for distinct (media_id, thumbnail_url) from recent imports
  //    Uses COALESCE across thumbnailUrlFields to get the best available URL
  //    Filters: date >= DATE_SUB(CURRENT_DATE(), INTERVAL {lookbackDays} DAY)
  //    Groups by media_id to get one URL per media item
  //
  // 2. List existing S3 keys under `thumbnails/{platform}/` prefix
  //    Uses ListObjectsV2 for batch efficiency
  //
  // 3. For each media_id NOT already on S3:
  //    - Stream the source URL → S3 via streamUrlToS3()
  //    - Use concurrency limit (e.g., 5 parallel uploads) via p-limit
  //    - Log failures but don't halt the pipeline
  //
  // 4. Return stats for logging
}
```

**BigQuery Query (executed once per sync):**
```sql
SELECT DISTINCT
  {mediaIdField} AS media_id,
  COALESCE({thumbnailUrlField1}, {thumbnailUrlField2}) AS thumbnail_url
FROM `{importTable}`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL {lookbackDays} DAY)
  AND COALESCE({thumbnailUrlField1}, {thumbnailUrlField2}) IS NOT NULL
```

This is a single, efficient query per import source — no per-row queries.

### Step 5: Create Thumbnail Job Definitions

**File: `src/jobs/thumbnails/socialMedia.thumbnail.ts`**

```typescript
export const socialMediaThumbnailSync = {
  id: "socialMediaThumbnailSync",
  configs: [
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
  ],
};
```

**File: `src/jobs/thumbnails/creativeAds.thumbnail.ts`**

```typescript
export const creativeAdsThumbnailSync = {
  id: "creativeAdsThumbnailSync",
  configs: [
    {
      platform: "facebook_ads",
      importTable: "imports.facebook_ads_creative",
      mediaIdField: "creative_id",
      thumbnailUrlFields: ["thumbnail_url"],
      lookbackDays: 7,
    },
  ],
};
```

### Step 6: Integrate Thumbnail Phase into Pipeline

**File: `src/queue/types.ts`**

Add `"thumbnail"` to the `PipelineJobData.phase` union:
```typescript
phase: "import" | "thumbnail" | "entity" | "aggregateReport" | "monitor" | "superlative" | "full";
```

**File: `src/queue/worker.ts`**

Update the `full` pipeline phases array:
```typescript
const phases =
  phase === "full"
    ? (["import", "thumbnail", "entity", "aggregateReport", "monitor", "superlative"] as const)
    : [phase] as const;
```

**File: `src/queue/pipeline.ts`**

Add thumbnail phase handler:
```typescript
} else if (phase === "thumbnail") {
  // Only run if S3 is configured
  if (process.env.S3_BUCKET) {
    const { syncThumbnails } = await import("../shared/vendors/aws/thumbnailSync");
    // Discover and run all thumbnail sync jobs
    for (const config of thumbnailConfigs) {
      const stats = await syncThumbnails(config);
      console.log(`  [thumbnail] ${config.platform}: ${stats.uploaded} uploaded, ${stats.skipped} skipped`);
    }
  }
}
```

### Step 7: Update Entity SQL Expressions to Use S3 URLs

The key insight: instead of storing S3 URLs in the database, we **derive them** in the entity SQL expressions. This eliminates any need for update queries.

**File: `src/jobs/entities/social-media-daily/social-media-daily.entity.ts`**

Change the `thumbnail_url` dimension:
```typescript
thumbnail_url: {
  type: z.string(),
  sources: {
    instagramMedia: {
      expression: `CASE
        WHEN media_id IS NOT NULL THEN CONCAT('${S3_PUBLIC_URL}/thumbnails/instagram/', media_id, '.jpg')
        ELSE COALESCE(media_thumbnail_url, media_url)
      END`
    },
    facebookOrganicPosts: {
      expression: `CASE
        WHEN post_id IS NOT NULL THEN CONCAT('${S3_PUBLIC_URL}/thumbnails/facebook_organic/', post_id, '.jpg')
        ELSE COALESCE(full_picture, post_picture)
      END`
    },
  },
},
```

> **Note:** The `S3_PUBLIC_URL` will be injected as a constant at entity definition time. If S3 is not configured, it falls back to the original platform URLs — graceful degradation.

**File: `src/jobs/entities/creative-daily/creative-daily.entity.ts`**

Same pattern for Facebook Ads creative thumbnails:
```typescript
thumbnail_url: {
  type: z.string(),
  sources: {
    facebookAdsCreative: {
      expression: `CASE
        WHEN creative_id IS NOT NULL THEN CONCAT('${S3_PUBLIC_URL}/thumbnails/facebook_ads/', creative_id, '.jpg')
        ELSE thumbnail_url
      END`
    },
    googleAdsCreative: { expression: "CAST(NULL AS STRING)" },
  },
},
```

### Step 8: S3 Bucket Configuration

The S3 bucket should be configured with:
- **Public read access** (or CloudFront distribution) so thumbnails are accessible via URL
- **Standard storage class** (thumbnails are small, frequently accessed)
- **No lifecycle policy needed** (thumbnails are small and should persist indefinitely)
- **CORS headers** if accessed directly from the browser

Recommended bucket policy for public read:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::maxmarketing-thumbnails/thumbnails/*"
  }]
}
```

---

## Efficiency Guarantees

| Requirement | How It's Met |
|------------|--------------|
| **Happens within 24 hours** | Runs as part of the daily 6 AM UTC pipeline, immediately after imports |
| **Only once per thumbnail** | S3 key is deterministic; existence check via `ListObjectsV2` before upload |
| **Only new thumbnails** | BQ query filters to `lookbackDays` (7 days); S3 existence check skips already-uploaded |
| **No redundant copies** | Deterministic key + existence check = idempotent |
| **Efficient BQ queries** | One `SELECT DISTINCT` query per import source (3 total), partitioned by date |
| **No DB updates needed** | S3 URL derived in entity SQL from `platform` + `media_id` — zero UPDATE queries |
| **Efficient transfer** | Stream directly from source URL → S3, no intermediate disk writes |

---

## Testing Strategy

### Unit Tests

1. **`getThumbnailS3Key()`** — verify deterministic key generation for each platform
2. **`getThumbnailPublicUrl()`** — verify correct URL construction
3. **Entity SQL expressions** — verify CASE/CONCAT logic generates correct S3 URLs, and fallback to original URLs when S3 is not configured

### Integration Tests

4. **`streamUrlToS3()`** — test with a real URL (e.g., a public image) → mock S3
5. **`syncThumbnails()`** — test with mock BigQuery results and mock S3:
   - Verify it skips existing thumbnails
   - Verify it uploads only new ones
   - Verify it handles failed uploads gracefully (doesn't crash pipeline)
   - Verify it respects concurrency limits

### End-to-End Tests

6. **Full pipeline run** — trigger a manual pipeline with `phase: "full"` and verify:
   - Thumbnail phase runs after import, before entity
   - Thumbnails appear on S3 with correct keys
   - Entity queries produce correct S3 URLs
7. **Graceful degradation** — run pipeline without `S3_BUCKET` set, verify:
   - Thumbnail phase is skipped
   - Entity expressions fall back to original platform URLs
   - No errors in logs

### Manual Verification

8. Verify expired Instagram/Facebook URLs no longer work (expected)
9. Verify S3-hosted URLs serve the correct images
10. Verify the dashboard displays thumbnails correctly using S3 URLs

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Source URL expires before sync** | Thumbnail not captured | Low (sync runs daily, tokens last 24-48h typically) | Could add a secondary sync at 6 PM UTC if needed |
| **S3 upload fails** | Individual thumbnail missing | Low | Graceful failure — log and continue; retry on next pipeline run |
| **Large number of thumbnails** | Slow sync phase | Medium | Concurrency-limited parallel uploads (5); only processes 7-day window |
| **S3 costs** | Unexpected bills | Low | Thumbnails are small (~50-200KB each); standard S3 pricing is minimal |
| **S3 credentials misconfigured** | Thumbnail phase fails entirely | Medium | Phase is optional; pipeline continues without thumbnails; clear error logging |
| **BigQuery query cost** | Extra query cost | Low | Single `SELECT DISTINCT` per source; uses date partition pruning |
| **Entity SQL complexity** | Harder to maintain | Low | CASE expressions are straightforward; well-documented; fallback is clean |
| **Breaking change to entity URLs** | Existing cached/shared URLs break | Medium | Only affects entity-layer URLs; original import data preserved; can revert expression easily |

---

## Future Considerations

- **TikTok support**: When TikTok imports are added, create a new thumbnail sync config entry — the pattern is identical
- **CloudFront CDN**: Add a CloudFront distribution in front of S3 for faster global delivery and caching
- **Image optimization**: Resize/compress thumbnails during upload to reduce storage and bandwidth (e.g., sharp library)
- **Backfill script**: One-time script to sync historical thumbnails for media items imported before this feature
