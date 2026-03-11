# Brand Pulse — Implementation Plan

## Vision

"How Many Times Did the World See You?" — The Brand Pulse consolidates every verified brand touchpoint (organic, paid, and engaged) into a single view showing the total "weight" of the brand in the market. Rooted in the marketing principle that consumers need multiple exposures before acting, the score tells clients whether their brand is gaining or losing presence.

## Design Reference

The visual is a layered "Gravity Center" donut (see `brand-pulse.png`):
- **Center:** Total Brand Impressions as the hero number (e.g., "2.4M") with period label
- **Outer rings:** Three concentric arcs sized proportionally — Earned (lime/green), Paid (cyan/blue), Engaged (indigo/purple)
- **Right panel:** Brand Impact Score (0–100), MoM % change, YoY % change
- **Below score:** Layer breakdown with percentage + raw number per layer

---

## Mathematics

### 1. Three Awareness Layers

#### Earned Layer (Organic Visibility)

Exposure the brand earned through content, reputation, and recognition — before any click.

| Metric | BigQuery Table | Column | Filter |
|--------|---------------|--------|--------|
| FB page impressions | `entities.social_accounts_daily` | `reach` | `platform = 'facebook'` |
| IG account reach | `entities.social_accounts_daily` | `reach` | `platform = 'instagram'` |
| IG post impressions | `entities.social_media_daily` | `impressions` | `platform = 'instagram'` |
| FB post impressions | `entities.social_media_daily` | `impressions` | `platform = 'facebook'` |
| GSC search impressions | `entities.gsc_daily` | `impressions` | (all queries) |

```sql
Earned = SUM(social_accounts_daily.reach)        -- FB page + IG account reach
       + SUM(social_media_daily.impressions)      -- FB + IG post impressions
       + SUM(gsc_daily.impressions)               -- all search impressions
```

**Decision:** GA4 organic/direct traffic is excluded from Earned — counted only in Engaged.

#### Paid Exposure Layer

Exposure the brand purchased through advertising.

| Metric | BigQuery Table | Column | Filter |
|--------|---------------|--------|--------|
| Google Ads impressions | `entities.ads_daily` | `impressions` | `platform = 'google'` |
| Meta Ads impressions | `entities.ads_daily` | `impressions` | `platform = 'facebook'` |

```sql
Paid = SUM(ads_daily.impressions)  -- all platforms
```

#### Engaged Layer

Confirmed interactions where a consumer acted on the brand — not just passive viewing.

| Metric | BigQuery Table | Column | Filter |
|--------|---------------|--------|--------|
| GSC clicks | `entities.gsc_daily` | `clicks` | (all) |
| Google Ads clicks | `entities.ads_daily` | `clicks` | `platform = 'google'` |
| Meta Ads clicks | `entities.ads_daily` | `clicks` | `platform = 'facebook'` |
| FB post engagement | `entities.social_media_daily` | `engagement` | `platform = 'facebook'` |
| IG post engagement | `entities.social_media_daily` | `engagement` | `platform = 'instagram'` |
| GA4 pageviews (direct) | `entities.ga4_daily` | `views` | `channel_group = 'Direct'` |
| GA4 pageviews (organic) | `entities.ga4_daily` | `views` | `channel_group = 'Organic Search'` |
| GA4 engaged sessions | `entities.ga4_daily` | `engaged_sessions` | (all channels) |
| Shopify orders | `entities.shopify_daily` | `orders` | (all — validation signal) |

```sql
Engaged = SUM(gsc_daily.clicks)
        + SUM(ads_daily.clicks)
        + SUM(social_media_daily.engagement)
        + SUM(ga4_daily.views) WHERE channel_group IN ('Direct', 'Organic Search')
        + SUM(ga4_daily.engaged_sessions)
        + SUM(shopify_daily.orders)
```

#### Total Brand Impressions

```
Total Brand Impressions = Earned + Paid + Engaged
```

#### Layer Percentages

```
Earned %  = Earned / Total × 100
Paid %    = Paid / Total × 100
Engaged % = Engaged / Total × 100
```

These percentages size the donut rings proportionally.

---

### 2. Brand Impact Score (0–100)

Normalized against the client's own rolling 6-month baseline. **50 = steady state.** Above 50 = growing. Below 50 = shrinking.

**Critical: Normalize to daily rates** so the score works for any date range (5 days, 30 days, 90 days).

```
current_daily_rate = current_total / days_in_selected_range
baseline_daily_rate = 6_month_total / 180

ratio = current_daily_rate / baseline_daily_rate
score = clamp(ratio × 50, 0, 100)
```

Examples:
- `ratio = 1.0` → score = 50 (steady state)
- `ratio = 1.44` → score = 72 (44% above baseline)
- `ratio = 2.0` → score = 100 (doubled from baseline)
- `ratio = 0.6` → score = 30 (40% below baseline)

**Cold start:** For accounts with < 6 months of data, use whatever history is available. If no baseline data exists, default score to 50.

---

### 3. Comparison Metrics

#### Month-over-Month (MoM)

Compare current range against the same number of days immediately prior:

```
range_days = endDate - startDate + 1
prev_start = startDate - range_days
prev_end   = startDate - 1

MoM % = ((current_total - prev_total) / prev_total) × 100
```

#### Year-over-Year (YoY)

Compare against the same date range one year ago:

```
yoy_start = startDate - 365 days
yoy_end   = endDate - 365 days

YoY % = ((current_total - yoy_total) / yoy_total) × 100
```

#### Hero Maker Logic

Automatically select the most impressive comparison for internal reports:

```
comparisons = {
  mom: MoM %,
  yoy: YoY %,
  3mo: ((current - avg_of_prior_3_equivalent_periods) / avg) × 100
}
hero_comparison = max(comparisons)  // pick the most positive story
```

---

## Implementation

### Phase 1: Backend — Expand `/api/dashboard/blocks` Brand Pulse Response

**File:** `src/server/routes/dashboard.ts`

The existing Brand Pulse block (lines 879–950) currently only uses:
- `ads_daily.impressions` (Paid)
- `social_media_daily.impressions` (Earned/Organic)
- `gsc_daily.impressions` (Search)

#### Changes needed:

**1a. Add new parallel queries for missing data sources:**

```typescript
// ───────── Brand Pulse: Earned extras ─────────
// Social accounts reach (FB page + IG account level reach)
const brandEarnedAccountsPromise = socialIds.length > 0
  ? safe(async () => {
      const [rows] = await bq.query({
        query: `
          WITH curr AS (
            SELECT SUM(reach) as reach
            FROM \`entities.social_accounts_daily\`
            WHERE account_id IN UNNEST(@accountIds)
              AND date >= @startDate AND date <= @endDate
          ),
          prev AS (
            SELECT SUM(reach) as reach
            FROM \`entities.social_accounts_daily\`
            WHERE account_id IN UNNEST(@accountIds)
              AND date >= @prevStartDate AND date <= @prevEndDate
          ),
          yoy AS (
            SELECT SUM(reach) as reach
            FROM \`entities.social_accounts_daily\`
            WHERE account_id IN UNNEST(@accountIds)
              AND date >= DATE_SUB(@startDate, INTERVAL 1 YEAR)
              AND date <= DATE_SUB(@endDate, INTERVAL 1 YEAR)
          )
          SELECT
            COALESCE((SELECT reach FROM curr), 0) as curr_reach,
            COALESCE((SELECT reach FROM prev), 0) as prev_reach,
            COALESCE((SELECT reach FROM yoy), 0) as yoy_reach
        `,
        params: { accountIds: socialIds, ...dateParams },
      });
      return rows[0];
    })
  : Promise.resolve(null);

// ───────── Brand Pulse: Engaged components ─────────
// GA4 direct+organic pageviews + engaged sessions
const brandEngagedGA4Promise = ga4Ids.length > 0
  ? safe(async () => {
      const [rows] = await bq.query({
        query: `
          WITH curr AS (
            SELECT
              SUM(CASE WHEN channel_group IN ('Direct', 'Organic Search') THEN views ELSE 0 END) as direct_organic_views,
              SUM(engaged_sessions) as engaged_sessions
            FROM \`entities.ga4_daily\`
            WHERE account_id IN UNNEST(@accountIds)
              AND date >= @startDate AND date <= @endDate
          ),
          prev AS (
            SELECT
              SUM(CASE WHEN channel_group IN ('Direct', 'Organic Search') THEN views ELSE 0 END) as direct_organic_views,
              SUM(engaged_sessions) as engaged_sessions
            FROM \`entities.ga4_daily\`
            WHERE account_id IN UNNEST(@accountIds)
              AND date >= @prevStartDate AND date <= @prevEndDate
          ),
          yoy AS (
            SELECT
              SUM(CASE WHEN channel_group IN ('Direct', 'Organic Search') THEN views ELSE 0 END) as direct_organic_views,
              SUM(engaged_sessions) as engaged_sessions
            FROM \`entities.ga4_daily\`
            WHERE account_id IN UNNEST(@accountIds)
              AND date >= DATE_SUB(@startDate, INTERVAL 1 YEAR)
              AND date <= DATE_SUB(@endDate, INTERVAL 1 YEAR)
          )
          SELECT
            COALESCE((SELECT direct_organic_views FROM curr), 0) as curr_views,
            COALESCE((SELECT engaged_sessions FROM curr), 0) as curr_engaged,
            COALESCE((SELECT direct_organic_views FROM prev), 0) as prev_views,
            COALESCE((SELECT engaged_sessions FROM prev), 0) as prev_engaged,
            COALESCE((SELECT direct_organic_views FROM yoy), 0) as yoy_views,
            COALESCE((SELECT engaged_sessions FROM yoy), 0) as yoy_engaged
        `,
        params: { accountIds: ga4Ids, ...dateParams },
      });
      return rows[0];
    })
  : Promise.resolve(null);

// Social engagement (likes, comments, shares, saves)
const brandEngagedSocialPromise = socialIds.length > 0
  ? safe(async () => {
      const [rows] = await bq.query({
        query: `
          WITH curr AS (
            SELECT SUM(engagement) as engagement
            FROM \`entities.social_media_daily\`
            WHERE account_id IN UNNEST(@accountIds)
              AND date >= @startDate AND date <= @endDate
          ),
          prev AS (
            SELECT SUM(engagement) as engagement
            FROM \`entities.social_media_daily\`
            WHERE account_id IN UNNEST(@accountIds)
              AND date >= @prevStartDate AND date <= @prevEndDate
          ),
          yoy AS (
            SELECT SUM(engagement) as engagement
            FROM \`entities.social_media_daily\`
            WHERE account_id IN UNNEST(@accountIds)
              AND date >= DATE_SUB(@startDate, INTERVAL 1 YEAR)
              AND date <= DATE_SUB(@endDate, INTERVAL 1 YEAR)
          )
          SELECT
            COALESCE((SELECT engagement FROM curr), 0) as curr_engagement,
            COALESCE((SELECT engagement FROM prev), 0) as prev_engagement,
            COALESCE((SELECT engagement FROM yoy), 0) as yoy_engagement
        `,
        params: { accountIds: socialIds, ...dateParams },
      });
      return rows[0];
    })
  : Promise.resolve(null);

// GSC clicks (already queried via gscBranded — extract clicks from that)
// Ads clicks (already available from adsByPlatform query — extract clicks)
// Shopify orders (already available from shopifySummary)
```

**1b. Update the 6-month baseline query to include all sources:**

```typescript
const brandBaselinePromise = safe(async () => {
  const queries: Promise<any>[] = [];

  // Earned baseline: social_media_daily impressions + social_accounts_daily reach + gsc impressions
  // Paid baseline: ads_daily impressions
  // Engaged baseline: ads clicks + gsc clicks + social engagement + ga4 views + shopify orders

  // ... (6 parallel queries, one per table, each returning all needed columns)

  const results = await Promise.all(queries);
  return {
    earned: results.socialPostImpressions + results.socialAccountReach + results.gscImpressions,
    paid: results.adsImpressions,
    engaged: results.adsClicks + results.gscClicks + results.socialEngagement
             + results.ga4DirectOrganicViews + results.ga4EngagedSessions + results.shopifyOrders,
  };
});
```

**1c. Rebuild the Brand Pulse block assembly (replace lines 879–950):**

```typescript
// Assemble layer totals from all queries
const earned = {
  curr: socialAccountReach.curr + socialPostImpressions.curr + gscImpressions.curr,
  prev: socialAccountReach.prev + socialPostImpressions.prev + gscImpressions.prev,
  yoy:  socialAccountReach.yoy  + socialPostImpressions.yoy  + gscImpressions.yoy,
};

const paid = {
  curr: adsImpressions.curr,
  prev: adsImpressions.prev,
  yoy:  adsImpressions.yoy,
};

const engaged = {
  curr: gscClicks.curr + adsClicks.curr + socialEngagement.curr
        + ga4DirectOrganicViews.curr + ga4EngagedSessions.curr + shopifyOrders.curr,
  prev: gscClicks.prev + adsClicks.prev + socialEngagement.prev
        + ga4DirectOrganicViews.prev + ga4EngagedSessions.prev + shopifyOrders.prev,
  yoy:  gscClicks.yoy + adsClicks.yoy + socialEngagement.yoy
        + ga4DirectOrganicViews.yoy + ga4EngagedSessions.yoy + shopifyOrders.yoy,
};

const totalCurr = earned.curr + paid.curr + engaged.curr;
const totalPrev = earned.prev + paid.prev + engaged.prev;
const totalYoY  = earned.yoy  + paid.yoy  + engaged.yoy;

// Score: normalize to daily rate vs 6-month baseline daily rate
const periodDays = daysBetween(startStr, endStr) + 1;
const currentDailyRate = periodDays > 0 ? totalCurr / periodDays : 0;
const baselineDailyRate = baselineTotal / 180;
const ratio = baselineDailyRate > 0 ? currentDailyRate / baselineDailyRate : 1;
const score = Math.round(Math.min(100, Math.max(0, ratio * 50)));

// Comparisons
const mom = pctChange(totalCurr, totalPrev);
const yoy = pctChange(totalCurr, totalYoY);

// Hero maker: pick the most impressive comparison
const comparisons = { mom, yoy };
const heroKey = Object.entries(comparisons).reduce((best, [k, v]) =>
  v > best[1] ? [k, v] : best, ['mom', mom]);

brandPulseBlock = {
  score,
  totalImpressions: totalCurr,
  mom,
  yoy,
  heroComparison: { type: heroKey[0], value: heroKey[1] },
  rings: {
    earned:  { value: earned.curr,  percent: totalCurr > 0 ? Math.round((earned.curr / totalCurr) * 100) : 0 },
    paid:    { value: paid.curr,    percent: totalCurr > 0 ? Math.round((paid.curr / totalCurr) * 100) : 0 },
    engaged: { value: engaged.curr, percent: totalCurr > 0 ? Math.round((engaged.curr / totalCurr) * 100) : 0 },
  },
};
```

**1d. Updated response shape:**

```typescript
// blocks.brandPulse
{
  score: number;              // 0-100, 50 = steady state
  totalImpressions: number;   // raw count for hero number
  mom: number;                // % change vs previous period (same # of days)
  yoy: number;                // % change vs same range last year
  heroComparison: {
    type: 'mom' | 'yoy';      // which comparison is most impressive
    value: number;             // the % change
  };
  rings: {
    earned:  { value: number; percent: number };
    paid:    { value: number; percent: number };
    engaged: { value: number; percent: number };
  };
}
```

---

### Phase 2: Frontend — Redesign BrandPulseBlock.vue

**File:** `src/client/src/components/dashboard/blocks/BrandPulseBlock.vue`

The current component is a minimal placeholder. Replace it with the full design from `brand-pulse.png`:

#### Layout (matching screenshot):

```
┌─────────────────────────────────────────────────────────────┐
│  BRAND PULSE                                          [hide]│
│                                                             │
│   ┌──────────────┐       BRAND IMPACT SCORE                 │
│   │  ╭───────╮   │       72 /100                            │
│   │  │ 2.4M  │   │       ▲ 18% MoM    ▲ 34% YoY           │
│   │  │ Total  │   │                                         │
│   │  │ Impr.  │   │       ● Earned (Organic)  45%  1.09M   │
│   │  ╰───────╯   │       ● Paid Exposure      35%  854K    │
│   └──────────────┘       ● Engaged             20%  493K   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Component props (updated):

```typescript
defineProps<{
  data: {
    score: number;
    totalImpressions: number;
    mom: number;
    yoy: number;
    heroComparison: { type: string; value: number };
    rings: {
      earned:  { value: number; percent: number };
      paid:    { value: number; percent: number };
      engaged: { value: number; percent: number };
    };
  };
}>();
```

#### Visual implementation:

- **Donut rings:** Use SVG `<circle>` elements with `stroke-dasharray` and `stroke-dashoffset` for proportional arcs. Three concentric circles:
  - Outer (r=70): Earned — `#84CC16` (lime)
  - Middle (r=55): Paid — `#06B6D4` (cyan)
  - Inner (r=40): Engaged — `#6C63FF` (indigo)
  - Arc length = `(percent / 100) × circumference`
- **Center text:** Total impressions formatted (2.4M, 854K, etc.)
- **Score panel:** Large number with `/100` suffix, MoM and YoY arrows below
- **Layer breakdown:** Three rows with colored dot, label, percentage, and formatted value
- **Dark background variant** (per screenshot): `bg-slate-900` with light text — or keep white to match dashboard. Decide during implementation.

---

### Phase 3: Date Range Compatibility

All math normalizes to daily rates, so custom date ranges (e.g., Apr 25–29) work correctly:

| Concern | Solution |
|---------|----------|
| Score with short range | Daily rate normalization: `total / days` vs `baseline / 180` |
| MoM comparison | Same # of days shifted back: Apr 25–29 → Apr 20–24 |
| YoY comparison | Same dates minus 365: Apr 25–29 2026 → Apr 25–29 2025 |
| Layer percentages | Ratios — inherently range-agnostic |
| Baseline cold start | Use available history; if none, score = 50 |

The existing `dateParams` infrastructure in `dashboard.ts` already calculates `prevStartDate`/`prevEndDate` with matching day counts (lines 54–79). YoY dates need to be added.

---

### Phase 4: Hero Maker & Exec Insight (Future)

For the monthly report use case, add an AI-generated exec insight:

```
"Your brand was seen 2.4 million times this month — up 18% from last
month and 34% from this time last year. The biggest driver was a 45%
surge in organic social reach, with your Instagram Reels generating
380K impressions alone."
```

This can be generated by passing the Brand Pulse data through the existing AI insight pipeline (if available) or as a template-based string with dynamic values. Defer to a later phase.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/server/routes/dashboard.ts` | Add new queries for social accounts reach, GA4 direct/organic views, social engagement, Shopify orders. Expand baseline query. Rebuild brand pulse block assembly with 3-layer math, YoY support, hero comparison. |
| `src/client/src/components/dashboard/blocks/BrandPulseBlock.vue` | Full redesign: SVG concentric donut, score panel, MoM+YoY arrows, layer breakdown with values. Update props interface. |

No new files needed. No new dependencies needed.

---

## Data Sources Not Yet Available

| Source | Status | Impact |
|--------|--------|--------|
| TikTok Organic | Not integrated | Missing from Earned layer |
| TikTok Ads | Not integrated | Missing from Paid layer |
| Email (Klaviyo) | Not integrated | Could add to Engaged layer |

These can be added to the layer sums when their import jobs are built — the architecture supports it with no math changes.

---

## Key Decisions (Confirmed)

1. **Use pageviews** (`views`) from GA4, not sessions
2. **GA4 organic/direct excluded from Earned** — counted only in Engaged layer
3. **TikTok not included** — not yet in system
4. **Cold start:** Use available history; default score = 50 if no baseline
5. **Score normalization:** Simple ratio × 50 (not z-score) — more intuitive to explain
