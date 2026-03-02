import { Router, Request, Response } from "express";
import { createBigQueryClient } from "../../shared/vendors/google/bigquery/bigquery";
import { logger } from "../logger";

const router = Router();

/** Wrap a promise so individual query failures don't break the whole response */
async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    logger.warn({ err }, "Dashboard block query failed (non-fatal)");
    return null;
  }
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// GET /api/dashboard/blocks
router.get("/blocks", async (req: Request, res: Response) => {
  const {
    googleAdsId,
    facebookAdsId,
    ga4Id,
    shopifyId,
    instagramId,
    facebookPageId,
    gscId,
    startDate,
    endDate,
  } = req.query;

  // Collect platform IDs
  const adsIds: string[] = [];
  if (googleAdsId) adsIds.push(String(googleAdsId));
  if (facebookAdsId) adsIds.push(String(facebookAdsId));

  const shopifyIds: string[] = shopifyId ? [String(shopifyId)] : [];
  const ga4Ids: string[] = ga4Id ? [String(ga4Id)] : [];
  const socialIds: string[] = [];
  if (instagramId) socialIds.push(String(instagramId));
  if (facebookPageId) socialIds.push(String(facebookPageId));
  const gscIds: string[] = gscId ? [String(gscId)] : [];

  // Date range
  let startStr: string;
  let endStr: string;
  let prevStartStr: string;
  let prevEndStr: string;

  if (startDate && endDate) {
    startStr = String(startDate);
    endStr = String(endDate);
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffDays =
      Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays + 1);
    prevStartStr = prevStart.toISOString().split("T")[0];
    prevEndStr = prevEnd.toISOString().split("T")[0];
  } else {
    const now = new Date();
    endStr = now.toISOString().split("T")[0];
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    startStr = start.toISOString().split("T")[0];
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 30);
    prevStartStr = prevStart.toISOString().split("T")[0];
    prevEndStr = prevEnd.toISOString().split("T")[0];
  }

  try {
    const bq = createBigQueryClient();

    const dateParams = {
      startDate: startStr,
      endDate: endStr,
      prevStartDate: prevStartStr,
      prevEndDate: prevEndStr,
    };

    // ───────── 1. Paid ads by platform (current + prev) ─────────
    const adsByPlatformPromise =
      adsIds.length > 0
        ? safe(async () => {
            const [rows] = await bq.query({
              query: `
              WITH curr AS (
                SELECT platform,
                  SUM(spend) as spend, SUM(impressions) as impressions,
                  SUM(reach) as reach, SUM(clicks) as clicks,
                  SUM(conversions) as conversions, SUM(conversions_value) as conversions_value
                FROM \`entities.ads_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @startDate AND date <= @endDate
                GROUP BY platform
              ),
              prev AS (
                SELECT platform,
                  SUM(spend) as spend, SUM(impressions) as impressions,
                  SUM(reach) as reach, SUM(clicks) as clicks,
                  SUM(conversions) as conversions, SUM(conversions_value) as conversions_value
                FROM \`entities.ads_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @prevStartDate AND date <= @prevEndDate
                GROUP BY platform
              )
              SELECT
                COALESCE(c.platform, p.platform) as platform,
                COALESCE(c.spend, 0) as curr_spend, COALESCE(p.spend, 0) as prev_spend,
                COALESCE(c.impressions, 0) as curr_impressions, COALESCE(p.impressions, 0) as prev_impressions,
                COALESCE(c.reach, 0) as curr_reach, COALESCE(p.reach, 0) as prev_reach,
                COALESCE(c.clicks, 0) as curr_clicks, COALESCE(p.clicks, 0) as prev_clicks,
                COALESCE(c.conversions, 0) as curr_conversions, COALESCE(p.conversions, 0) as prev_conversions,
                COALESCE(c.conversions_value, 0) as curr_conversions_value, COALESCE(p.conversions_value, 0) as prev_conversions_value
              FROM curr c
              FULL OUTER JOIN prev p USING (platform)
            `,
              params: { accountIds: adsIds, ...dateParams },
            });
            return rows;
          })
        : Promise.resolve(null);

    // ───────── 2. Paid ads daily trend ─────────
    const adsDailyPromise =
      adsIds.length > 0
        ? safe(async () => {
            const [rows] = await bq.query({
              query: `
              SELECT date,
                SUM(spend) as spend, SUM(impressions) as impressions,
                SUM(reach) as reach
              FROM \`entities.ads_daily\`
              WHERE account_id IN UNNEST(@accountIds)
                AND date >= @startDate AND date <= @endDate
              GROUP BY date
              ORDER BY date
            `,
              params: { accountIds: adsIds, ...dateParams },
            });
            return rows;
          })
        : Promise.resolve(null);

    // ───────── 3. Shopify summary (current + prev) ─────────
    const shopifySummaryPromise =
      shopifyIds.length > 0
        ? safe(async () => {
            const [rows] = await bq.query({
              query: `
              WITH curr AS (
                SELECT SUM(revenue) as revenue, SUM(orders) as orders
                FROM \`entities.shopify_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @startDate AND date <= @endDate
              ),
              prev AS (
                SELECT SUM(revenue) as revenue, SUM(orders) as orders
                FROM \`entities.shopify_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @prevStartDate AND date <= @prevEndDate
              )
              SELECT
                COALESCE(c.revenue, 0) as curr_revenue, COALESCE(p.revenue, 0) as prev_revenue,
                COALESCE(c.orders, 0) as curr_orders, COALESCE(p.orders, 0) as prev_orders
              FROM curr c, prev p
            `,
              params: { accountIds: shopifyIds, ...dateParams },
            });
            return rows[0];
          })
        : Promise.resolve(null);

    // ───────── 4. Shopify 14-day daily ─────────
    const shopify14dPromise =
      shopifyIds.length > 0
        ? safe(async () => {
            const end14 = new Date(endStr);
            const start14 = new Date(end14);
            start14.setDate(start14.getDate() - 13);
            const [rows] = await bq.query({
              query: `
              SELECT date, SUM(revenue) as revenue, SUM(orders) as orders
              FROM \`entities.shopify_daily\`
              WHERE account_id IN UNNEST(@accountIds)
                AND date >= @start14 AND date <= @end14
              GROUP BY date
              ORDER BY date
            `,
              params: {
                accountIds: shopifyIds,
                start14: start14.toISOString().split("T")[0],
                end14: endStr,
              },
            });
            return rows;
          })
        : Promise.resolve(null);

    // ───────── 5. New customer count (current + prev) ─────────
    const newCustomersPromise =
      shopifyIds.length > 0
        ? safe(async () => {
            const [rows] = await bq.query({
              query: `
              WITH curr AS (
                SELECT COUNT(DISTINCT customer_id) as new_customers
                FROM \`imports.shopify_orders\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @startDate AND date <= @endDate
                  AND LOWER(COALESCE(customer_is_returning, 'false')) != 'true'
              ),
              prev AS (
                SELECT COUNT(DISTINCT customer_id) as new_customers
                FROM \`imports.shopify_orders\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @prevStartDate AND date <= @prevEndDate
                  AND LOWER(COALESCE(customer_is_returning, 'false')) != 'true'
              )
              SELECT
                COALESCE(c.new_customers, 0) as curr_new_customers,
                COALESCE(p.new_customers, 0) as prev_new_customers
              FROM curr c, prev p
            `,
              params: { accountIds: shopifyIds, ...dateParams },
            });
            return rows[0];
          })
        : Promise.resolve(null);

    // ───────── 6. Social organic by platform (current + prev) ─────────
    const socialByPlatformPromise =
      socialIds.length > 0
        ? safe(async () => {
            const [rows] = await bq.query({
              query: `
              WITH curr AS (
                SELECT platform,
                  SUM(impressions) as impressions, SUM(engagement) as engagement,
                  SUM(likes) as likes, SUM(comments) as comments, SUM(shares) as shares
                FROM \`entities.social_media_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @startDate AND date <= @endDate
                GROUP BY platform
              ),
              prev AS (
                SELECT platform,
                  SUM(impressions) as impressions, SUM(engagement) as engagement,
                  SUM(likes) as likes, SUM(comments) as comments, SUM(shares) as shares
                FROM \`entities.social_media_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @prevStartDate AND date <= @prevEndDate
                GROUP BY platform
              )
              SELECT
                COALESCE(c.platform, p.platform) as platform,
                COALESCE(c.impressions, 0) as curr_impressions, COALESCE(p.impressions, 0) as prev_impressions,
                COALESCE(c.engagement, 0) as curr_engagement, COALESCE(p.engagement, 0) as prev_engagement,
                COALESCE(c.likes, 0) as curr_likes, COALESCE(c.comments, 0) as curr_comments,
                COALESCE(c.shares, 0) as curr_shares
              FROM curr c
              FULL OUTER JOIN prev p USING (platform)
            `,
              params: { accountIds: socialIds, ...dateParams },
            });
            return rows;
          })
        : Promise.resolve(null);

    // ───────── 7. Follower snapshot + period adds ─────────
    const followersPromise =
      socialIds.length > 0
        ? safe(async () => {
            const [rows] = await bq.query({
              query: `
              WITH latest AS (
                SELECT platform, account_id,
                  MAX(date) as max_date
                FROM \`entities.social_accounts_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date <= @endDate
                GROUP BY platform, account_id
              ),
              snapshot AS (
                SELECT s.platform, s.followers
                FROM \`entities.social_accounts_daily\` s
                INNER JOIN latest l ON s.platform = l.platform
                  AND s.account_id = l.account_id AND s.date = l.max_date
              ),
              adds AS (
                SELECT platform,
                  SUM(follower_adds) as period_adds
                FROM \`entities.social_accounts_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @startDate AND date <= @endDate
                GROUP BY platform
              )
              SELECT
                s.platform, s.followers,
                COALESCE(a.period_adds, 0) as period_adds
              FROM snapshot s
              LEFT JOIN adds a ON s.platform = a.platform
            `,
              params: { accountIds: socialIds, ...dateParams },
            });
            return rows;
          })
        : Promise.resolve(null);

    // ───────── 8. GSC branded vs non-branded (current + prev) ─────────
    const gscBrandedPromise =
      gscIds.length > 0
        ? safe(async () => {
            const [rows] = await bq.query({
              query: `
              WITH curr AS (
                SELECT branded_vs_nonbranded,
                  SUM(impressions) as impressions, SUM(clicks) as clicks
                FROM \`entities.gsc_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @startDate AND date <= @endDate
                GROUP BY branded_vs_nonbranded
              ),
              prev AS (
                SELECT branded_vs_nonbranded,
                  SUM(impressions) as impressions, SUM(clicks) as clicks
                FROM \`entities.gsc_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @prevStartDate AND date <= @prevEndDate
                GROUP BY branded_vs_nonbranded
              )
              SELECT
                COALESCE(c.branded_vs_nonbranded, p.branded_vs_nonbranded) as segment,
                COALESCE(c.impressions, 0) as curr_impressions, COALESCE(p.impressions, 0) as prev_impressions,
                COALESCE(c.clicks, 0) as curr_clicks, COALESCE(p.clicks, 0) as prev_clicks
              FROM curr c
              FULL OUTER JOIN prev p USING (branded_vs_nonbranded)
            `,
              params: { accountIds: gscIds, ...dateParams },
            });
            return rows;
          })
        : Promise.resolve(null);

    // ───────── 9. GSC daily trend ─────────
    const gscDailyPromise =
      gscIds.length > 0
        ? safe(async () => {
            const [rows] = await bq.query({
              query: `
              SELECT date, SUM(impressions) as impressions, SUM(clicks) as clicks
              FROM \`entities.gsc_daily\`
              WHERE account_id IN UNNEST(@accountIds)
                AND date >= @startDate AND date <= @endDate
              GROUP BY date
              ORDER BY date
            `,
              params: { accountIds: gscIds, ...dateParams },
            });
            return rows;
          })
        : Promise.resolve(null);

    // ───────── 10. GA4 by channel group (current + prev) ─────────
    const ga4ByChannelPromise =
      ga4Ids.length > 0
        ? safe(async () => {
            const [rows] = await bq.query({
              query: `
              WITH curr AS (
                SELECT channel_group,
                  SUM(sessions) as sessions, SUM(engaged_sessions) as engaged_sessions,
                  SUM(active_users) as active_users
                FROM \`entities.ga4_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @startDate AND date <= @endDate
                GROUP BY channel_group
              ),
              prev AS (
                SELECT channel_group,
                  SUM(sessions) as sessions, SUM(engaged_sessions) as engaged_sessions,
                  SUM(active_users) as active_users
                FROM \`entities.ga4_daily\`
                WHERE account_id IN UNNEST(@accountIds)
                  AND date >= @prevStartDate AND date <= @prevEndDate
                GROUP BY channel_group
              )
              SELECT
                COALESCE(c.channel_group, p.channel_group) as channel_group,
                COALESCE(c.sessions, 0) as curr_sessions, COALESCE(p.sessions, 0) as prev_sessions,
                COALESCE(c.engaged_sessions, 0) as curr_engaged, COALESCE(p.engaged_sessions, 0) as prev_engaged,
                COALESCE(c.active_users, 0) as curr_users, COALESCE(p.active_users, 0) as prev_users
              FROM curr c
              FULL OUTER JOIN prev p USING (channel_group)
            `,
              params: { accountIds: ga4Ids, ...dateParams },
            });
            return rows;
          })
        : Promise.resolve(null);

    // ───────── 11. GA4 daily trend ─────────
    const ga4DailyPromise =
      ga4Ids.length > 0
        ? safe(async () => {
            const [rows] = await bq.query({
              query: `
              SELECT date, SUM(sessions) as sessions, SUM(engaged_sessions) as engaged_sessions
              FROM \`entities.ga4_daily\`
              WHERE account_id IN UNNEST(@accountIds)
                AND date >= @startDate AND date <= @endDate
              GROUP BY date
              ORDER BY date
            `,
              params: { accountIds: ga4Ids, ...dateParams },
            });
            return rows;
          })
        : Promise.resolve(null);

    // ───────── 12. Social daily trend (for Reach Breakdown sparkline) ─────────
    const socialDailyPromise =
      socialIds.length > 0
        ? safe(async () => {
            const [rows] = await bq.query({
              query: `
              SELECT date, SUM(impressions) as impressions
              FROM \`entities.social_media_daily\`
              WHERE account_id IN UNNEST(@accountIds)
                AND date >= @startDate AND date <= @endDate
              GROUP BY date
              ORDER BY date
            `,
              params: { accountIds: socialIds, ...dateParams },
            });
            return rows;
          })
        : Promise.resolve(null);

    // ───────── 13. Brand Pulse 6-month baseline ─────────
    const baselineStart = new Date(endStr);
    baselineStart.setDate(baselineStart.getDate() - 180);
    const baselineStartStr = baselineStart.toISOString().split("T")[0];

    const brandBaselinePromise = safe(async () => {
      const queries: Promise<any>[] = [];

      // Paid impressions baseline
      if (adsIds.length > 0) {
        queries.push(
          bq
            .query({
              query: `
              SELECT SUM(impressions) as impressions
              FROM \`entities.ads_daily\`
              WHERE account_id IN UNNEST(@accountIds)
                AND date >= @baselineStart AND date <= @endDate
            `,
              params: { accountIds: adsIds, baselineStart: baselineStartStr, endDate: endStr },
            })
            .then(([r]) => ({ paid: r[0]?.impressions || 0 }))
        );
      } else {
        queries.push(Promise.resolve({ paid: 0 }));
      }

      // Organic social impressions baseline
      if (socialIds.length > 0) {
        queries.push(
          bq
            .query({
              query: `
              SELECT SUM(impressions) as impressions
              FROM \`entities.social_media_daily\`
              WHERE account_id IN UNNEST(@accountIds)
                AND date >= @baselineStart AND date <= @endDate
            `,
              params: { accountIds: socialIds, baselineStart: baselineStartStr, endDate: endStr },
            })
            .then(([r]) => ({ organic: r[0]?.impressions || 0 }))
        );
      } else {
        queries.push(Promise.resolve({ organic: 0 }));
      }

      // GSC impressions baseline
      if (gscIds.length > 0) {
        queries.push(
          bq
            .query({
              query: `
              SELECT SUM(impressions) as impressions
              FROM \`entities.gsc_daily\`
              WHERE account_id IN UNNEST(@accountIds)
                AND date >= @baselineStart AND date <= @endDate
            `,
              params: { accountIds: gscIds, baselineStart: baselineStartStr, endDate: endStr },
            })
            .then(([r]) => ({ search: r[0]?.impressions || 0 }))
        );
      } else {
        queries.push(Promise.resolve({ search: 0 }));
      }

      const results = await Promise.all(queries);
      return results.reduce((acc, r) => ({ ...acc, ...r }), {});
    });

    // ═══════ Execute all in parallel ═══════
    const [
      adsByPlatform,
      adsDaily,
      shopifySummary,
      shopify14d,
      newCustomers,
      socialByPlatform,
      followers,
      gscBranded,
      gscDaily,
      ga4ByChannel,
      ga4Daily,
      socialDaily,
      brandBaseline,
    ] = await Promise.all([
      adsByPlatformPromise,
      adsDailyPromise,
      shopifySummaryPromise,
      shopify14dPromise,
      newCustomersPromise,
      socialByPlatformPromise,
      followersPromise,
      gscBrandedPromise,
      gscDailyPromise,
      ga4ByChannelPromise,
      ga4DailyPromise,
      socialDailyPromise,
      brandBaselinePromise,
    ]);

    // ═══════ Assemble block responses ═══════

    // --- Helpers ---
    const totalAdsSpend = adsByPlatform
      ? (adsByPlatform as any[]).reduce((s: number, r: any) => s + (r.curr_spend || 0), 0)
      : 0;
    const prevTotalAdsSpend = adsByPlatform
      ? (adsByPlatform as any[]).reduce((s: number, r: any) => s + (r.prev_spend || 0), 0)
      : 0;
    const totalAdsImpressions = adsByPlatform
      ? (adsByPlatform as any[]).reduce((s: number, r: any) => s + (r.curr_impressions || 0), 0)
      : 0;
    const prevTotalAdsImpressions = adsByPlatform
      ? (adsByPlatform as any[]).reduce((s: number, r: any) => s + (r.prev_impressions || 0), 0)
      : 0;
    const totalAdsReach = adsByPlatform
      ? (adsByPlatform as any[]).reduce((s: number, r: any) => s + (r.curr_reach || 0), 0)
      : 0;

    // --- MER Block ---
    let merBlock = null;
    if (shopifySummary && adsByPlatform) {
      const totalRevenue = (shopifySummary as any).curr_revenue || 0;
      const prevRevenue = (shopifySummary as any).prev_revenue || 0;
      const mer = totalAdsSpend > 0 ? totalRevenue / totalAdsSpend : 0;
      const prevMer = prevTotalAdsSpend > 0 ? prevRevenue / prevTotalAdsSpend : 0;
      merBlock = {
        value: mer,
        change: pctChange(mer, prevMer),
        daily: adsDaily
          ? (adsDaily as any[]).map((d: any) => d.spend || 0)
          : [],
        totalRevenue,
        totalSpend: totalAdsSpend,
      };
    }

    // --- Acquisition Check Block ---
    let acquisitionBlock = null;
    if (newCustomers && adsByPlatform) {
      const nc = (newCustomers as any).curr_new_customers || 0;
      const prevNc = (newCustomers as any).prev_new_customers || 0;
      const trueCac = nc > 0 ? totalAdsSpend / nc : 0;
      const prevTrueCac = prevNc > 0 ? prevTotalAdsSpend / prevNc : 0;

      const platformRows = adsByPlatform
        ? (adsByPlatform as any[]).map((r: any) => {
            const conversions = r.curr_conversions || 0;
            return {
              platform: r.platform,
              cpa: conversions > 0 ? (r.curr_spend || 0) / conversions : 0,
              spend: r.curr_spend || 0,
            };
          })
        : [];
      const platformTotalConversions = adsByPlatform
        ? (adsByPlatform as any[]).reduce(
            (s: number, r: any) => s + (r.curr_conversions || 0),
            0
          )
        : 0;
      const platformCac =
        platformTotalConversions > 0 ? totalAdsSpend / platformTotalConversions : 0;
      const overclaimPct =
        platformCac > 0 && trueCac > 0
          ? ((trueCac / platformCac - 1) * 100)
          : 0;

      acquisitionBlock = {
        trueCac,
        trueCacChange: pctChange(trueCac, prevTrueCac),
        platformRows,
        newCustomers: nc,
        overclaimPct,
      };
    }

    // --- Sales Pulse Block ---
    let salesPulseBlock = null;
    if (shopify14d) {
      const days14 = shopify14d as any[];
      const totalRevenue14d = days14.reduce((s: number, d: any) => s + (d.revenue || 0), 0);
      const totalOrders14d = days14.reduce((s: number, d: any) => s + (d.orders || 0), 0);
      const avgOrders = days14.length > 0 ? totalOrders14d / days14.length : 0;
      const avgAov = totalOrders14d > 0 ? totalRevenue14d / totalOrders14d : 0;

      // Simple momentum: compare last 7 days vs first 7 days
      const firstHalf = days14.slice(0, 7);
      const secondHalf = days14.slice(7);
      const firstRev = firstHalf.reduce((s: number, d: any) => s + (d.revenue || 0), 0);
      const secondRev = secondHalf.reduce((s: number, d: any) => s + (d.revenue || 0), 0);
      const momentum = firstRev > 0 ? ((secondRev - firstRev) / firstRev) * 100 : 0;

      salesPulseBlock = {
        momentum,
        trend: momentum >= 0 ? "up" : "down",
        daily: days14.map((d: any) => ({
          date: d.date,
          revenue: d.revenue || 0,
          orders: d.orders || 0,
          aov: (d.orders || 0) > 0 ? (d.revenue || 0) / (d.orders || 0) : 0,
        })),
        totalRevenue14d,
        avgOrders: Math.round(avgOrders * 10) / 10,
        avgAov: Math.round(avgAov * 100) / 100,
      };
    }

    // --- Audience Growth Block ---
    let audienceGrowthBlock = null;
    if (followers) {
      const platforms = (followers as any[]).map((r: any) => {
        const f = r.followers || 0;
        const adds = r.period_adds || 0;
        return {
          platform: r.platform,
          followers: f,
          periodAdds: adds,
          growthRate: f > 0 ? (adds / f) * 100 : 0,
        };
      });
      const totalFollowers = platforms.reduce((s, p) => s + p.followers, 0);
      const fastestGrowing = platforms.length > 0
        ? platforms.reduce((best, p) => (p.growthRate > best.growthRate ? p : best)).platform
        : null;

      audienceGrowthBlock = {
        totalFollowers,
        platforms,
        fastestGrowing,
      };
    }

    // --- Paid Reach Block ---
    let paidReachBlock = null;
    if (adsByPlatform && (adsByPlatform as any[]).length > 0) {
      const platforms = (adsByPlatform as any[]).map((r: any) => {
        const imp = r.curr_impressions || 0;
        const spend = r.curr_spend || 0;
        const cpm = imp > 0 ? (spend / imp) * 1000 : 0;
        return { platform: r.platform, impressions: imp, cpm, isBest: false };
      });
      // Mark best CPM
      if (platforms.length > 0) {
        const bestIdx = platforms.reduce(
          (bi, p, i) => (p.cpm > 0 && (bi === -1 || p.cpm < platforms[bi].cpm) ? i : bi),
          -1
        );
        if (bestIdx >= 0) platforms[bestIdx].isBest = true;
      }

      // Paid vs organic %
      const organicImp = socialByPlatform
        ? (socialByPlatform as any[]).reduce(
            (s: number, r: any) => s + (r.curr_impressions || 0),
            0
          )
        : 0;
      const totalImp = totalAdsImpressions + organicImp;
      const paidPct = totalImp > 0 ? (totalAdsImpressions / totalImp) * 100 : 0;

      paidReachBlock = {
        totalImpressions: totalAdsImpressions,
        totalReach: totalAdsReach,
        totalSpend: totalAdsSpend,
        platforms,
        paidVsOrganicPct: Math.round(paidPct),
        daily: adsDaily
          ? (adsDaily as any[]).map((d: any) => d.impressions || 0)
          : [],
      };
    }

    // --- Search Visibility Block ---
    let searchVisibilityBlock = null;
    if (gscBranded) {
      const branded = (gscBranded as any[]).find(
        (r: any) => r.segment?.toLowerCase() === "branded"
      ) || { curr_impressions: 0, curr_clicks: 0, prev_impressions: 0 };
      const nonBranded = (gscBranded as any[]).find(
        (r: any) => r.segment?.toLowerCase() !== "branded"
      ) || { curr_impressions: 0, curr_clicks: 0, prev_impressions: 0 };

      const totalImp =
        (branded.curr_impressions || 0) + (nonBranded.curr_impressions || 0);
      const prevTotalImp =
        (branded.prev_impressions || 0) + (nonBranded.prev_impressions || 0);

      const bImp = branded.curr_impressions || 0;
      const bClicks = branded.curr_clicks || 0;
      const nbImp = nonBranded.curr_impressions || 0;
      const nbClicks = nonBranded.curr_clicks || 0;

      searchVisibilityBlock = {
        totalImpressions: totalImp,
        totalImpressionsChange: pctChange(totalImp, prevTotalImp),
        daily: gscDaily
          ? (gscDaily as any[]).map((d: any) => d.impressions || 0)
          : [],
        branded: {
          impressions: bImp,
          clicks: bClicks,
          ctr: bImp > 0 ? (bClicks / bImp) * 100 : 0,
        },
        nonBranded: {
          impressions: nbImp,
          clicks: nbClicks,
          ctr: nbImp > 0 ? (nbClicks / nbImp) * 100 : 0,
        },
      };
    }

    // --- Reach Breakdown Block ---
    let reachBreakdownBlock = null;
    {
      const channels: { label: string; impressions: number; change: number; pct: number }[] = [];
      let total = 0;
      let prevTotal = 0;

      if (adsByPlatform) {
        for (const r of adsByPlatform as any[]) {
          const label = r.platform === "google" ? "Google Ads" : r.platform === "facebook" ? "Meta Ads" : r.platform;
          const curr = r.curr_impressions || 0;
          const prev = r.prev_impressions || 0;
          channels.push({ label, impressions: curr, change: pctChange(curr, prev), pct: 0 });
          total += curr;
          prevTotal += prev;
        }
      }
      if (socialByPlatform) {
        for (const r of socialByPlatform as any[]) {
          const label = r.platform === "instagram" ? "Instagram" : r.platform === "facebook" ? "Facebook" : r.platform;
          const curr = r.curr_impressions || 0;
          const prev = r.prev_impressions || 0;
          channels.push({ label: `${label} Organic`, impressions: curr, change: pctChange(curr, prev), pct: 0 });
          total += curr;
          prevTotal += prev;
        }
      }
      if (gscBranded) {
        const gscTotal = (gscBranded as any[]).reduce(
          (s: number, r: any) => s + (r.curr_impressions || 0),
          0
        );
        const gscPrev = (gscBranded as any[]).reduce(
          (s: number, r: any) => s + (r.prev_impressions || 0),
          0
        );
        channels.push({ label: "Organic Search", impressions: gscTotal, change: pctChange(gscTotal, gscPrev), pct: 0 });
        total += gscTotal;
        prevTotal += gscPrev;
      }

      // Calculate percentages
      for (const ch of channels) {
        ch.pct = total > 0 ? (ch.impressions / total) * 100 : 0;
      }

      // Merge daily impression series from ads + social + gsc for sparkline
      const dailyMap = new Map<string, number>();
      if (adsDaily) {
        for (const d of adsDaily as any[]) {
          const key = String(d.date);
          dailyMap.set(key, (dailyMap.get(key) || 0) + (d.impressions || 0));
        }
      }
      if (socialDaily) {
        for (const d of socialDaily as any[]) {
          const key = String(d.date);
          dailyMap.set(key, (dailyMap.get(key) || 0) + (d.impressions || 0));
        }
      }
      if (gscDaily) {
        for (const d of gscDaily as any[]) {
          const key = String(d.date);
          dailyMap.set(key, (dailyMap.get(key) || 0) + (d.impressions || 0));
        }
      }
      const reachDaily = [...dailyMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v);

      if (channels.length > 0) {
        reachBreakdownBlock = {
          total,
          totalChange: pctChange(total, prevTotal),
          channels: channels.sort((a, b) => b.impressions - a.impressions),
          daily: reachDaily.length > 1 ? reachDaily : undefined,
        };
      }
    }

    // --- Site Traffic Block ---
    let siteTrafficBlock = null;
    if (ga4ByChannel) {
      const totalSessions = (ga4ByChannel as any[]).reduce(
        (s: number, r: any) => s + (r.curr_sessions || 0),
        0
      );
      const prevSessions = (ga4ByChannel as any[]).reduce(
        (s: number, r: any) => s + (r.prev_sessions || 0),
        0
      );
      const totalEngaged = (ga4ByChannel as any[]).reduce(
        (s: number, r: any) => s + (r.curr_engaged || 0),
        0
      );
      const engagedRate = totalSessions > 0 ? (totalEngaged / totalSessions) * 100 : 0;

      const channels = (ga4ByChannel as any[])
        .map((r: any) => ({
          label: r.channel_group || "Other",
          sessions: r.curr_sessions || 0,
          pct: totalSessions > 0 ? ((r.curr_sessions || 0) / totalSessions) * 100 : 0,
          change: pctChange(r.curr_sessions || 0, r.prev_sessions || 0),
        }))
        .sort((a: any, b: any) => b.sessions - a.sessions);

      siteTrafficBlock = {
        totalSessions,
        totalSessionsChange: pctChange(totalSessions, prevSessions),
        engagedRate: Math.round(engagedRate * 10) / 10,
        daily: ga4Daily
          ? (ga4Daily as any[]).map((d: any) => d.sessions || 0)
          : [],
        channels,
      };
    }

    // --- Brand Pulse Block ---
    let brandPulseBlock = null;
    if (brandBaseline) {
      const bl = brandBaseline as { paid: number; organic: number; search: number };
      const periodDays =
        Math.ceil(
          Math.abs(new Date(endStr).getTime() - new Date(startStr).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;
      const baselineDays = 180;

      // Normalize to daily rates then compare
      const dailyPaid = bl.paid / baselineDays;
      const dailyOrganic = bl.organic / baselineDays;
      const dailySearch = bl.search / baselineDays;

      // Current period daily rates
      const currPaidImp = totalAdsImpressions;
      const currOrgImp = socialByPlatform
        ? (socialByPlatform as any[]).reduce(
            (s: number, r: any) => s + (r.curr_impressions || 0),
            0
          )
        : 0;
      const currSearchImp = gscBranded
        ? (gscBranded as any[]).reduce(
            (s: number, r: any) => s + (r.curr_impressions || 0),
            0
          )
        : 0;
      const prevOrgImp = socialByPlatform
        ? (socialByPlatform as any[]).reduce(
            (s: number, r: any) => s + (r.prev_impressions || 0),
            0
          )
        : 0;

      const currDailyPaid = periodDays > 0 ? currPaidImp / periodDays : 0;
      const currDailyOrganic = periodDays > 0 ? currOrgImp / periodDays : 0;
      const currDailySearch = periodDays > 0 ? currSearchImp / periodDays : 0;

      // Score each ring 0-100 relative to baseline
      const paidScore = dailyPaid > 0 ? Math.min(100, (currDailyPaid / dailyPaid) * 100) : 50;
      const earnedScore =
        dailyOrganic > 0 ? Math.min(100, (currDailyOrganic / dailyOrganic) * 100) : 50;
      const engagedScore =
        dailySearch > 0 ? Math.min(100, (currDailySearch / dailySearch) * 100) : 50;

      const score = Math.round((paidScore + earnedScore + engagedScore) / 3);

      const totalImpressions = currPaidImp + currOrgImp + currSearchImp;
      const prevTotalImpressions =
        prevTotalAdsImpressions + prevOrgImp +
        (gscBranded
          ? (gscBranded as any[]).reduce(
              (s: number, r: any) => s + (r.prev_impressions || 0),
              0
            )
          : 0);

      brandPulseBlock = {
        score,
        scoreChange: pctChange(score, 50), // Relative to midpoint baseline
        rings: {
          earned: Math.round(earnedScore),
          paid: Math.round(paidScore),
          engaged: Math.round(engagedScore),
        },
        totalImpressions,
        totalImpressionsChange: pctChange(totalImpressions, prevTotalImpressions),
      };
    }

    res.json({
      period: {
        start: startStr,
        end: endStr,
        prevStart: prevStartStr,
        prevEnd: prevEndStr,
      },
      blocks: {
        brandPulse: brandPulseBlock,
        mer: merBlock,
        acquisitionCheck: acquisitionBlock,
        salesPulse: salesPulseBlock,
        audienceGrowth: audienceGrowthBlock,
        paidReach: paidReachBlock,
        searchVisibility: searchVisibilityBlock,
        reachBreakdown: reachBreakdownBlock,
        siteTraffic: siteTrafficBlock,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching dashboard blocks");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
