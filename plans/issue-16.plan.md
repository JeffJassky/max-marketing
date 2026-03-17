# Implementation Plan: Add TikTok Support (#16)

## Summary

Integrate TikTok Organic data throughout the full stack — from Windsor API data imports through BigQuery entities, dashboard API, and client-side UI. This follows the established patterns used for Instagram and Facebook Organic, adding TikTok as a third social platform with both video-level and account-level data.

The Windsor `tiktok_organic` connector provides 50 metrics and 45 dimensions covering both account-level metrics (followers, profile views, engagement) and video-level metrics (views, likes, comments, shares, reach).

---

## Affected Files and Modules

### New Files
| File | Purpose |
|------|---------|
| `src/jobs/imports/tiktok_organic/media.import.ts` | TikTok video-level import (Windsor → BigQuery) |
| `src/jobs/imports/tiktok_organic/account.import.ts` | TikTok account-level import (Windsor → BigQuery) |
| `src/jobs/entities/social-media-daily/aggregateReports/tiktok-post-performance.aggregateReport.ts` | TikTok video performance report |

### Modified Files
| File | Change |
|------|--------|
| `src/shared/vendors/windsor/windsor.d.ts` | Add `'tiktok_organic'` to `WindsorConnector` type |
| `src/jobs/entities/social-media-daily/social-media-daily.entity.ts` | Add `tiktokOrganicMedia` as a source |
| `src/jobs/entities/social-accounts-daily/social-accounts-daily.entity.ts` | Add `tiktokOrganicAccount` as a source |
| `src/server/models/ClientAccount.ts` | Add `tiktokId` field to schema |
| `src/server/routes/dashboard.ts` | Include `tiktokId` in `socialIds`, add query param |
| `src/client/src/views/OverviewsView.vue` | Add TikTok tab to overviews |
| `src/client/src/components/dashboard/blocks/AudienceGrowthBlock.vue` | Add TikTok platform label/color |
| `src/client/src/components/dashboard/blocks/ReachBreakdownBlock.vue` | Add TikTok platform support (if platform-specific colors) |

---

## Step-by-Step Implementation

### Phase 1: Data Layer (Server — Imports)

#### 1.1 Add `tiktok_organic` to Windsor connector types

**File:** `src/shared/vendors/windsor/windsor.d.ts`

Add `'tiktok_organic'` to the `WindsorConnector` union type:
```typescript
export type WindsorConnector =
  | 'facebook'
  | 'facebook_organic'
  | 'google_ads'
  | 'googleanalytics4'
  | 'instagram'
  | 'searchconsole'
  | 'tiktok_organic'
```

#### 1.2 Create TikTok video import

**File:** `src/jobs/imports/tiktok_organic/media.import.ts`

Following the pattern of `instagram/media.import.ts`, create a `BronzeImport` for TikTok video-level data.

- **Endpoint:** `tiktok_organic`
- **Platform:** `tiktok`
- **Date preset:** `last_90d` (same as Instagram media)
- **Partition by:** `date`
- **Cluster by:** `['account_id', 'video_id']`

**Dimensions (from Windsor docs):**
| Windsor Field | Zod Type | Notes |
|---------------|----------|-------|
| `date` | `z.string()` | Partition key |
| `account_id` | `z.string()` | The TikTok username |
| `account_name` | `z.string().optional()` | Display name |
| `video_id` | `z.string()` | Unique video identifier |
| `video_caption` | `z.string().optional()` | Video caption/description |
| `video_share_url` | `z.string().optional()` | Shareable URL (permalink equivalent) |
| `video_thumbnail_url` | `z.string().optional()` | Preview thumbnail |
| `video_create_datetime` | `z.string().optional()` | Video publish time |
| `video_duration` | `z.number().optional()` | Duration in seconds |

**Metrics:**
| Windsor Field | Zod Type | Maps To Entity |
|---------------|----------|----------------|
| `video_views_count` | `z.number()` | `impressions` (also `views`) |
| `video_likes` | `z.number()` | `likes` |
| `video_comments` | `z.number()` | `comments` |
| `video_shares` | `z.number()` | `shares` |
| `video_reach` | `z.number()` | Used for reach-based impressions |
| `video_favorites` | `z.number()` | Additional engagement metric |

**Engagement** will be derived as: `video_likes + video_comments + video_shares + video_favorites`

#### 1.3 Create TikTok account import

**File:** `src/jobs/imports/tiktok_organic/account.import.ts`

Following the pattern of `instagram/account.import.ts`:

- **Endpoint:** `tiktok_organic`
- **Platform:** `tiktok`
- **Date preset:** `last_30d`
- **Partition by:** `date`
- **Cluster by:** `['account_id']`
- **Uniqueness key:** `['date', 'account_id']`

**Dimensions:**
| Windsor Field | Zod Type |
|---------------|----------|
| `date` | `z.string()` |
| `account_id` | `z.string()` |
| `account_name` | `z.string().optional()` |

**Metrics:**
| Windsor Field | Zod Type | Maps To Entity |
|---------------|----------|----------------|
| `total_followers_count` | `z.number()` | `followers` (snapshot) |
| `followers_count` | `z.number()` | `follower_adds` (daily net change) |
| `daily_lost_followers` | `z.number()` | `follower_removes` |
| `profile_views` | `z.number()` | `profile_views` |
| `engaged_audience` | `z.number()` | `engaged_users` |
| `unique_video_views` | `z.number()` | `reach` (daily reached audience) |

---

### Phase 2: Entity Layer (Unified Schemas)

#### 2.1 Add TikTok to `socialMediaDaily` entity

**File:** `src/jobs/entities/social-media-daily/social-media-daily.entity.ts`

Add `tiktokOrganicMedia` as a third source alongside `instagramMedia` and `facebookOrganicPosts`:

```typescript
import { tiktokOrganicMedia } from "../../imports/tiktok_organic/media.import";

// sources: [instagramMedia, facebookOrganicPosts, tiktokOrganicMedia]
```

**Dimension mappings for `tiktokOrganicMedia`:**
| Entity Dimension | TikTok Source |
|-----------------|---------------|
| `platform` | `expression: "'tiktok'"` |
| `media_id` | `sourceField: "video_id"` |
| `media_type` | `expression: "'VIDEO'"` (all TikTok content is video) |
| `caption` | `sourceField: "video_caption"` |
| `permalink` | `sourceField: "video_share_url"` |
| `published_at` | `sourceField: "video_create_datetime"` |
| `thumbnail_url` | S3 expression (following IG/FB pattern) or `"video_thumbnail_url"` |

**Metric mappings for `tiktokOrganicMedia`:**
| Entity Metric | TikTok Source |
|--------------|---------------|
| `impressions` | `expression: "SUM(COALESCE(video_reach, video_views_count))"` |
| `views` | `sourceField: "video_views_count"` |
| `likes` | `sourceField: "video_likes"` |
| `comments` | `sourceField: "video_comments"` |
| `shares` | `sourceField: "video_shares"` |
| `engagement` | `expression: "SUM(COALESCE(video_likes, 0) + COALESCE(video_comments, 0) + COALESCE(video_shares, 0) + COALESCE(video_favorites, 0))"` |

#### 2.2 Add TikTok to `socialAccountsDaily` entity

**File:** `src/jobs/entities/social-accounts-daily/social-accounts-daily.entity.ts`

Add `tiktokOrganicAccount` as a third source:

```typescript
import { tiktokOrganicAccount } from "../../imports/tiktok_organic/account.import";

// sources: [instagramAccount, facebookOrganicAccount, tiktokOrganicAccount]
```

**Metric mappings for `tiktokOrganicAccount`:**
| Entity Metric | TikTok Source |
|--------------|---------------|
| `followers` | `sourceField: "total_followers_count"` (aggregation: max) |
| `follower_adds` | `sourceField: "followers_count"` (daily net gain) |
| `follower_removes` | `sourceField: "daily_lost_followers"` |
| `reach` | `sourceField: "unique_video_views"` (daily reached audience) |
| `profile_views` | `sourceField: "profile_views"` |
| `engaged_users` | `sourceField: "engaged_audience"` |

---

### Phase 3: Aggregate Reports

#### 3.1 Create TikTok Post Performance Report

**File:** `src/jobs/entities/social-media-daily/aggregateReports/tiktok-post-performance.aggregateReport.ts`

Following the pattern of `instagram-post-performance.aggregateReport.ts`:

```typescript
export const tiktokPostPerformance = new AggregateReport({
  id: "tiktokPostPerformance",
  description: "Detailed organic performance for TikTok videos.",
  source: socialMediaDaily,
  predicate: "platform = 'tiktok' AND (engagement > 0 OR impressions > 0)",
  window: { id: "last_90d", lookbackDays: 90, dateDimension: "date" },
  output: {
    grain: ["account_id", "thumbnail_url", "caption"],
    includeDimensions: ["permalink", "media_type", "published_at"],
    metrics: {
      impressions: { aggregation: "sum", display: { format: "number", description: "Total video views/reach for your TikTok content." } },
      likes: { aggregation: "sum", display: { format: "number", description: "Total likes on your TikTok videos." } },
      comments: { aggregation: "sum", display: { format: "number", description: "Total comments on your TikTok videos." } },
      shares: { aggregation: "sum", display: { format: "number", description: "Total shares of your TikTok videos." } },
      engagement: { aggregation: "sum", display: { format: "number", description: "Total interactions including likes, comments, shares, and favorites." } },
    },
    derivedFields: {
      engagement_rate: {
        expression: "SAFE_DIVIDE(engagement, impressions)",
        type: z.number(),
        display: { format: "percent", description: "Engagement divided by reach. Indicates content resonance." },
      },
    },
  },
  orderBy: { field: "impressions", direction: "desc" },
});
```

#### 3.2 Update superlatives platform limit

In `social-media-daily.entity.ts`, update the `platform` superlative limit from `2` to `3` to accommodate the addition of TikTok:

```typescript
{
  dimensionId: "platform",
  dimensionLabel: "Platform",
  limit: 3, // was 2
  ...
}
```

---

### Phase 4: Server API

#### 4.1 Add `tiktokId` to account model

**File:** `src/server/models/ClientAccount.ts`

```typescript
const ClientAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  googleAdsId: z.string().optional().nullable(),
  facebookAdsId: z.string().optional().nullable(),
  ga4Id: z.string().optional().nullable(),
  shopifyId: z.string().optional().nullable(),
  instagramId: z.string().optional().nullable(),
  facebookPageId: z.string().optional().nullable(),
  gscId: z.string().optional().nullable(),
  tiktokId: z.string().optional().nullable(), // NEW
});
```

#### 4.2 Update dashboard route

**File:** `src/server/routes/dashboard.ts`

1. Accept `tiktokId` from query params
2. Add it to the `socialIds` array if present
3. No query changes needed — the social queries already use `socialIds` array and query from `entities.social_media_daily` / `entities.social_accounts_daily` which will automatically include TikTok data once the entities are updated

```typescript
const { ..., tiktokId, ... } = req.query;

// Add to socialIds
if (tiktokId) socialIds.push(String(tiktokId));
```

#### 4.3 Register the TikTok aggregate report

Ensure the `tiktokPostPerformance` report is registered/exported so the `/api/reports/:reportId/live` route can serve it. Follow the same pattern used for `instagramPostPerformance` and `facebookPostPerformance`.

---

### Phase 5: Client UI

#### 5.1 Add TikTok to account interface

**File:** `src/client/src/views/OverviewsView.vue` (and any shared type definitions)

Add `tiktokId` to the `MaxAccount` interface:
```typescript
interface MaxAccount {
  ...
  tiktokId: string | null;
}
```

#### 5.2 Add TikTok tab to Overviews

**File:** `src/client/src/views/OverviewsView.vue`

Add a TikTok tab to `PlatformTab` and `tabs`:

```typescript
const PlatformTab = {
  ...
  TIKTOK: 'TIKTOK',
} as const;

// In tabs array (needs a TikTok icon - use a custom SVG or Music icon from lucide-vue-next)
{ id: PlatformTab.TIKTOK, label: 'TikTok', icon: Music, reportId: 'tiktokPostPerformance' },
```

Add to `platformToSectionKey`:
```typescript
[PlatformTab.TIKTOK]: 'sections.overviews.tiktok',
```

Update `loadReport` to pass `tiktokId` in params:
```typescript
if (acc.tiktokId) params.append('tiktokId', acc.tiktokId);
```

#### 5.3 Update AudienceGrowthBlock

**File:** `src/client/src/components/dashboard/blocks/AudienceGrowthBlock.vue`

Add TikTok platform support:
```typescript
const platformLabel = (p: string) => {
  if (p === 'instagram') return 'Instagram';
  if (p === 'facebook') return 'Facebook';
  if (p === 'tiktok') return 'TikTok';
  return p;
};

const platformDotColor = (p: string) => {
  if (p === 'instagram') return '#E1306C';
  if (p === 'facebook') return '#1877F2';
  if (p === 'tiktok') return '#000000'; // TikTok brand black (or #69C9D0 for teal)
  return '#9CA3AF';
};
```

#### 5.4 Update ReachBreakdownBlock (if platform-specific)

**File:** `src/client/src/components/dashboard/blocks/ReachBreakdownBlock.vue`

Add TikTok branding/label if the block renders platform-specific breakdowns.

#### 5.5 Update DashboardView

**File:** `src/client/src/views/DashboardView.vue`

Ensure `tiktokId` is passed to API calls for dashboard blocks.

---

### Phase 6: Account Settings UI

Add a TikTok account ID field to wherever account settings are managed (likely an admin/settings page), so users can link their TikTok account. This follows the same pattern as `instagramId` and `facebookPageId`.

---

## Windsor Field Mapping Reference

### Video-Level (media import → socialMediaDaily)

| Windsor Field | Import Field | Entity Field | Notes |
|---------------|-------------|--------------|-------|
| `video_id` | `video_id` | `media_id` | Unique video identifier |
| `video_caption` | `video_caption` | `caption` | Video description text |
| `video_share_url` | `video_share_url` | `permalink` | Shareable link |
| `video_thumbnail_url` | `video_thumbnail_url` | `thumbnail_url` | Preview image |
| `video_create_datetime` | `video_create_datetime` | `published_at` | Publish timestamp |
| `video_views_count` | `video_views_count` | `views` | Total view count |
| `video_reach` | `video_reach` | `impressions` | Unique viewers (preferred for impressions) |
| `video_likes` | `video_likes` | `likes` | Like count |
| `video_comments` | `video_comments` | `comments` | Comment count |
| `video_shares` | `video_shares` | `shares` | Share count |
| `video_favorites` | `video_favorites` | (part of `engagement`) | Favorites/saves |

### Account-Level (account import → socialAccountsDaily)

| Windsor Field | Import Field | Entity Field | Notes |
|---------------|-------------|--------------|-------|
| `total_followers_count` | `total_followers_count` | `followers` | Snapshot total |
| `followers_count` | `followers_count` | `follower_adds` | Daily net gain |
| `daily_lost_followers` | `daily_lost_followers` | `follower_removes` | Daily losses |
| `unique_video_views` | `unique_video_views` | `reach` | Daily reached audience |
| `profile_views` | `profile_views` | `profile_views` | Profile page visits |
| `engaged_audience` | `engaged_audience` | `engaged_users` | Engaged unique users |

---

## Testing Strategy

### Unit / Integration Tests
1. **Import schema validation** — Verify TikTok import Zod schemas correctly validate sample Windsor API responses
2. **Entity SQL generation** — Verify the entity correctly generates UNION ALL SQL that includes the TikTok source with proper field mappings
3. **Aggregate report** — Verify `tiktokPostPerformance` generates correct predicate-filtered queries

### Manual / E2E Testing
1. **Windsor API connectivity** — Run the TikTok import against a test account to verify Windsor returns data in the expected format
2. **BigQuery table creation** — Verify the import creates `imports.tiktok_organic_media` and `imports.tiktok_organic_account` tables with correct schemas
3. **Entity materialization** — Verify `entities.social_media_daily` and `entities.social_accounts_daily` correctly include TikTok rows with `platform = 'tiktok'`
4. **Dashboard API** — Test `/api/dashboard/blocks` with a `tiktokId` parameter and verify:
   - TikTok data appears in social-by-platform breakdown
   - Follower data includes TikTok platform
   - Brand Pulse metrics include TikTok reach/engagement
5. **Reports API** — Test `/api/reports/tiktokPostPerformance/live` returns correctly formatted data
6. **Client UI** — Verify:
   - TikTok tab appears in Overviews and loads report data
   - AudienceGrowthBlock shows TikTok with correct branding
   - ReachBreakdownBlock includes TikTok impressions
   - Superlatives include TikTok posts and show 3 platforms

### Data Quality Checks
1. Verify `video_reach` vs `video_views_count` — use reach for impressions when available
2. Verify `followers_count` represents daily net change (not cumulative)
3. Confirm `video_favorites` is additive with likes/comments/shares for engagement

---

## Risk Assessment

### Low Risk
- **Windsor connector type update** — Simple type addition, no runtime impact
- **AudienceGrowthBlock / ReachBreakdownBlock** — Small label/color additions, existing data flow unchanged
- **Aggregate report creation** — Follows exact existing pattern, isolated new file

### Medium Risk
- **Entity source additions** — Adding a third source to `socialMediaDaily` and `socialAccountsDaily` changes the generated UNION ALL queries. Need to verify SQL generation handles 3+ sources correctly (currently only 2).
- **Account model schema change** — Adding `tiktokId` requires a BigQuery schema migration on the `app_data.accounts` table. Existing rows need the column added (nullable, so backward compatible).
- **Windsor field interpretation** — Some Windsor fields have nuanced meanings:
  - `followers_count` is described as "Net number of followers gained" (not total), which maps to `follower_adds`
  - `total_followers_count` is the snapshot total
  - Need to verify this interpretation against actual API responses

### Higher Risk
- **Windsor API availability** — The `tiktok_organic` connector must be enabled and configured in Windsor. If the Windsor account doesn't have TikTok access, imports will fail silently (or error). Mitigation: The import system already handles failures gracefully via the `safe()` wrapper pattern.
- **TikTok API rate limits / data freshness** — TikTok's API has stricter rate limits than Meta. Windsor may have limitations on data availability windows. Mitigation: Start with `last_90d` for videos and `last_30d` for accounts, matching existing patterns. Adjust if needed.
- **No test TikTok account** — If no TikTok Business Account is connected in Windsor, we can't validate the full pipeline end-to-end until one is linked. Mitigation: Validate schema and SQL generation in isolation; defer full E2E testing until an account is available.

---

## Implementation Order

1. Windsor type update (trivial, unblocks everything)
2. Bronze imports (media + account)
3. Entity updates (socialMediaDaily + socialAccountsDaily)
4. Aggregate report (tiktokPostPerformance)
5. Account model + dashboard API route
6. Client UI (overviews tab, dashboard blocks)
7. Account settings UI (TikTok ID field)
8. Testing & validation
