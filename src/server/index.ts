import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createBigQueryClient } from "../shared/vendors/google/bigquery/bigquery";
import { googleAdsCoreKeywordPerformance } from "../jobs/imports/google_ads/core-keyword-performance.import";
import { facebookAdsInsights } from "../jobs/imports/facebook_ads/insights.import";
import { ga4PagePerformance } from "../jobs/imports/google_ga4/page-performance.import";
import { shopifyOrders } from "../jobs/imports/shopify/orders.import";
import { instagramMedia } from "../jobs/imports/instagram/media.import";
import { facebookOrganicPosts } from "../jobs/imports/facebook_organic/posts.import";

import { Monitor } from "../shared/data/monitor";
import { accountSpendAnomalyMonitor } from "../jobs/entities/ads-daily/monitors/account-spend-anomaly.monitor";
import { accountConversionDropMonitor } from "../jobs/entities/ads-daily/monitors/account-conversion-drop.monitor";
import { activePmaxCampaignMonitor } from "../jobs/entities/pmax-daily/monitors/active-pmax-campaign.monitor";
import { activeAdsCampaignMonitor } from "../jobs/entities/ads-daily/monitors/active-ads-campaign.monitor";
import { wastedSpendConversionMonitor } from "../jobs/entities/keyword-daily/monitors/wasted-spend-conversion.monitor";
import { wastedSpendClickMonitor } from "../jobs/entities/keyword-daily/monitors/wasted-spend-click.monitor";
import { highCPAMonitor } from "../jobs/entities/keyword-daily/monitors/high-cpa.monitor";
import { lowROASMonitor } from "../jobs/entities/keyword-daily/monitors/low-roas.monitor";
import { broadMatchDriftMonitor } from "../jobs/entities/keyword-daily/monitors/broad-match-drift.monitor";
import { audienceSaturationMonitor } from "../jobs/entities/ads-daily/monitors/audience-saturation.monitor";
import { creativeFatigueMonitor } from "../jobs/entities/creative-daily/monitors/creative-fatigue.monitor";
import { pmaxSpendBreakdown } from "../jobs/entities/pmax-daily/aggregateReports/pmax-spend-breakdown.aggregateReport";
import { adsSpendBreakdown } from "../jobs/entities/ads-daily/aggregateReports/ads-spend-breakdown.aggregateReport";
import { googleAdsCampaignPerformance } from "../jobs/entities/ads-daily/aggregateReports/google-ads-campaign.aggregateReport";
import { metaAdsCampaignPerformance } from "../jobs/entities/ads-daily/aggregateReports/meta-ads-campaign.aggregateReport";
import { ga4AcquisitionPerformance } from "../jobs/entities/ga4-daily/aggregateReports/ga4-acquisition.aggregateReport";
import { shopifySourcePerformance } from "../jobs/entities/shopify-daily/aggregateReports/shopify-source.aggregateReport";
import { socialPlatformPerformance } from "../jobs/entities/social-media-daily/aggregateReports/social-platform.aggregateReport";
import { creativePerformanceReport } from "../jobs/entities/creative-daily/aggregateReports/creative-performance.aggregateReport";
import { clientAccountModel } from "./models/ClientAccount";
import { buildReportQuery } from "../shared/data/queryBuilder";
import { AllAwards } from "../shared/data/awards/library";
import { prompt as analystPrompt } from "../shared/data/llm/analyst-reporter.prompt";
import { prompt as editorPrompt } from "../shared/data/llm/editor.prompt";
import { generateStructuredContent, generateContent } from "../shared/vendors/google/gemini";
import { coreMonitors, allAggregateReports } from "./registry";
import { MarketingAgent } from "./services/agent";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.post("/api/chat", async (req: Request, res: Response) => {
  const { messages, context } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  try {
    const agent = new MarketingAgent(context || {});
    const response = await agent.chat(messages);
    res.json({ text: response });
  } catch (error) {
    console.error("Error in chat agent:", error);
    res.status(500).json({ error: "The marketing agent encountered an error." });
  }
});

// --- Data Fetching Helpers ---

const fetchSuperlatives = async (bq: any, accountIds: string[], month?: string) => {
  let monthFilter = "";
  if (month) {
    monthFilter = "AND period_label = @month";
  } else {
    monthFilter = "AND period_label = (SELECT MAX(period_label) FROM `reports.superlatives_monthly`)";
  }

  const query = `
    SELECT *
    FROM \`reports.superlatives_monthly\`
    WHERE (group_id IN UNNEST(@accountIds) OR account_id IN UNNEST(@accountIds))
    ${monthFilter}
    ORDER BY metric_name, position ASC
    LIMIT 2000
  `;

  const [rows] = await bq.query({
    query,
    params: { accountIds, month: month || null },
  });

  return rows.map((row: any) => {
    const rowAwards = Array.isArray(row.awards) ? row.awards : [];
    return {
      ...row,
      awards: rowAwards
        .map((awardId: string) => {
          const info = AllAwards.find((a) => a.id === awardId);
          if (!info) return null;
          return {
            id: info.id,
            label: info.label,
            description: info.description,
            emoji: info.icon,
          };
        })
        .filter(Boolean),
    };
  });
};

const fetchOverviews = async (bq: any, accountIds: string[], start: string, end: string) => {
  const results: Record<string, any> = {};
  
  const promises = allAggregateReports.map(async (report) => {
    try {
      // Use 'total' grain for summary context
      const sql = buildReportQuery(report, {
        startDate: start,
        endDate: end,
        accountIds: accountIds,
        timeGrain: 'total'
      });
      
      const [rows] = await bq.query({
        query: sql,
        params: { accountIds },
      });
      
      results[report.id] = { rows }; 
    } catch (e) {
      console.warn(`Failed to fetch overview for ${report.id} in generation context`, e);
    }
  });
  
  await Promise.all(promises);
  return results;
};

const getDatesForMonth = (periodLabel: string) => {
  if (!periodLabel) return null;
  const parts = periodLabel.split('-').map(Number);
  if (parts.length !== 2) return null;
  const [year, month] = parts;
  const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const end = new Date(year, month, 0).toISOString().split('T')[0];
  return { start, end };
};

app.get("/api/platform-accounts", async (_req: Request, res: Response) => {
  try {
    const bq = createBigQueryClient();

    const googleQuery = `
      SELECT
        account_id AS id,
        ANY_VALUE(account_name) AS name
      FROM
        ${googleAdsCoreKeywordPerformance.fqn}
      WHERE account_id IS NOT NULL
      GROUP BY account_id
    `;

    const facebookQuery = `
      SELECT
        account_id AS id,
        ANY_VALUE(account_name) AS name
      FROM
        ${facebookAdsInsights.fqn}
      WHERE account_id IS NOT NULL
      GROUP BY account_id
    `;

    const ga4Query = `
      SELECT
        account_id AS id,
        ANY_VALUE(account_name) AS name
      FROM
        ${ga4PagePerformance.fqn}
      WHERE account_id IS NOT NULL
      GROUP BY account_id
    `;

    const shopifyQuery = `
      SELECT
        account_id AS id,
        ANY_VALUE(account_name) AS name
      FROM
        ${shopifyOrders.fqn}
      WHERE account_id IS NOT NULL
      GROUP BY account_id
    `;

    const instagramQuery = `
      SELECT
        account_id AS id,
        ANY_VALUE(account_name) AS name
      FROM
        ${instagramMedia.fqn}
      WHERE account_id IS NOT NULL
      GROUP BY account_id
    `;

    const facebookOrganicQuery = `
      SELECT
        account_id AS id,
        ANY_VALUE(account_name) AS name
      FROM
        ${facebookOrganicPosts.fqn}
      WHERE account_id IS NOT NULL
      GROUP BY account_id
    `;

    const [googleRowsPromise, facebookRowsPromise, ga4RowsPromise, shopifyRowsPromise, instagramRowsPromise, facebookOrganicRowsPromise] = [
      bq.query(googleQuery),
      bq.query(facebookQuery),
      bq.query(ga4Query),
      bq.query(shopifyQuery),
      bq.query(instagramQuery),
      bq.query(facebookOrganicQuery),
    ];

    const [[googleRows], [facebookRows], [ga4Rows], [shopifyRows], [instagramRows], [facebookOrganicRows]] = await Promise.all([
      googleRowsPromise,
      facebookRowsPromise,
      ga4RowsPromise,
      shopifyRowsPromise,
      instagramRowsPromise,
      facebookOrganicRowsPromise,
    ]);

    res.json({
      google: googleRows,
      facebook: facebookRows,
      ga4: ga4Rows,
      shopify: shopifyRows,
      instagram: instagramRows,
      facebook_organic: facebookOrganicRows,
    });
  } catch (error) {
    console.error("Error fetching platform accounts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/accounts", async (_req: Request, res: Response) => {
  try {
    const rows = await clientAccountModel.findAll();
    res.json(rows);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/accounts", async (req: Request, res: Response) => {
  try {
    await clientAccountModel.create(req.body);
    res.status(201).json({ message: "Account created" });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/accounts/:id", async (req: Request, res: Response) => {
  try {
    await clientAccountModel.update(req.params.id, req.body);
    res.json({ message: "Account updated" });
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/accounts/:id", async (req: Request, res: Response) => {
  try {
    await clientAccountModel.delete(req.params.id);
    res.json({ message: "Account deleted" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/monitors/anomalies", async (req: Request, res: Response) => {
  const { accountId, googleAdsId, facebookAdsId, ga4Id, monitorId } = req.query;

  const accountIds: string[] = [];
  if (accountId) accountIds.push(String(accountId));
  if (googleAdsId) accountIds.push(String(googleAdsId));
  if (facebookAdsId) accountIds.push(String(facebookAdsId));
  if (ga4Id) accountIds.push(String(ga4Id));

  const uniqueIds = Array.from(new Set(accountIds));

  if (uniqueIds.length === 0) {
    return res
      .status(400)
      .json({ error: "At least one account ID is required" });
  }

  try {
    if (monitorId) {
      // Find the specific monitor instance
      const monitor = coreMonitors.find((m) => m.id === monitorId);
      if (!monitor) return res.status(404).json({ error: "Monitor not found" });

      const rows = await monitor.getAnomalies(uniqueIds, 50);
      return res.json(rows);
    }

    // Unified feed
    const flat = await Monitor.getUnifiedAnomalies(
      coreMonitors,
      uniqueIds,
      10
    );
    res.json(flat);
  } catch (error) {
    console.error("Error fetching monitor anomalies:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -----------------------------------------------------------------------------
// Legacy API Adaptors (Migrated to Monitors/Reports)
// -----------------------------------------------------------------------------

app.get(
  "/api/signals/wasted-keyword-spend",
  async (req: Request, res: Response) => {
    const { accountId } = req.query;
    if (!accountId)
      return res.status(400).json({ error: "accountId required" });

    try {
      const rows = await Monitor.getUnifiedAnomalies(
        [wastedSpendClickMonitor, wastedSpendConversionMonitor],
        String(accountId)
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching wasted spend:", error);
      res.json([]);
    }
  }
);

app.get(
  "/api/signals/broad-match-drift-search-term",
  async (req: Request, res: Response) => {
    const { accountId } = req.query;
    if (!accountId)
      return res.status(400).json({ error: "accountId required" });

    try {
      const rows = await broadMatchDriftMonitor.getAnomalies(String(accountId));
      res.json(rows);
    } catch (error) {
      console.error("Error fetching drift:", error);
      res.json([]);
    }
  }
);

app.get(
  "/api/signals/low-performing-keyword",
  async (req: Request, res: Response) => {
    const { accountId } = req.query;
    if (!accountId)
      return res.status(400).json({ error: "accountId required" });

    try {
      const rows = await Monitor.getUnifiedAnomalies(
        [lowROASMonitor, highCPAMonitor],
        String(accountId)
      );

      const labeled = rows.map((r) => ({
        ...r,
        issue: r.monitor_id === lowROASMonitor.id ? "Low ROAS" : "High CPA",
      }));

      res.json(labeled);
    } catch (error) {
      console.error("Error fetching low performance:", error);
      res.json([]);
    }
  }
);

app.get(
  "/api/signals/pmax-spend-breakdown",
  async (req: Request, res: Response) => {
    const { accountId } = req.query;
    if (!accountId)
      return res.status(400).json({ error: "accountId required" });

    try {
      const rows = await pmaxSpendBreakdown.getData(String(accountId), 200);
      res.json(rows);
    } catch (error) {
      console.warn("Error fetching pmax breakdown:", error);
      res.json([]);
    }
  }
);

// --- Aggregate Report Endpoints ---

app.get("/api/aggregateReports/:reportId", async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const { accountId, googleAdsId, facebookAdsId, ga4Id, shopifyId, instagramId, facebookPageId } = req.query;

  const report = allAggregateReports.find((r) => r.id === reportId);
  if (!report) {
    // If not found in the list, it might be a specific endpoint handled below, 
    // so we call next() to let other routes handle it? 
    // But Express routing doesn't work like that if params capture it.
    // However, explicit routes like /api/aggregateReports/pmax-spend-breakdown defined BEFORE or AFTER?
    // If defined BEFORE, they take precedence. If defined AFTER, this one takes precedence.
    // I should check if pmax-spend-breakdown is in allAggregateReports. Yes it is.
    // So this generic handler can handle it too.
    return res.status(404).json({ error: "Report not found" });
  }

  const accountIds: string[] = [];
  if (accountId) accountIds.push(String(accountId));
  if (googleAdsId) accountIds.push(String(googleAdsId));
  if (facebookAdsId) accountIds.push(String(facebookAdsId));
  if (ga4Id) accountIds.push(String(ga4Id));
  if (shopifyId) accountIds.push(String(shopifyId));
  if (instagramId) accountIds.push(String(instagramId));
  if (facebookPageId) accountIds.push(String(facebookPageId));

  const uniqueIds = Array.from(new Set(accountIds));

  if (uniqueIds.length === 0) {
    return res.status(400).json({ error: "At least one account ID is required" });
  }

  try {
    const bq = createBigQueryClient();
    const tableFqn = `reports.${report.tableName}`; // Assuming 'reports' dataset

    // Basic query - can be enhanced with sorting/filtering from query params if needed
    const query = `
      SELECT *
      FROM \`${tableFqn}\`
      WHERE account_id IN UNNEST(@accountIds)
      AND detected_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
      ORDER BY detected_at DESC
      LIMIT 1000
    `;

    const [rows] = await bq.query({
      query,
      params: { accountIds: uniqueIds },
    });
    
    // De-duplicate if multiple snapshots exist (take latest per grain)
    // Actually, simply taking the latest detected_at per grain would be better SQL,
    // but for now, returning recent rows is okay. 
    // To be precise, let's filter to the latest detected_at in SQL.
    
    const latestQuery = `
      SELECT * EXCEPT (rn)
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY ${report.definition.output.grain.join(', ')} ORDER BY detected_at DESC) as rn
        FROM \`${tableFqn}\`
        WHERE account_id IN UNNEST(@accountIds)
        AND detected_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
      )
      WHERE rn = 1
    `;

    // Note: If grain columns are not unique enough, this might dedupe too aggressively?
    // The grain defined in AggregateReport IS the uniqueness key.
    
    const [cleanRows] = await bq.query({
      query: latestQuery,
      params: { accountIds: uniqueIds },
    });

    res.json(cleanRows);
  } catch (error) {
    console.error(`Error fetching report ${reportId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper to get all dates in range
const getDatesInRange = (startDate: string, endDate: string) => {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

app.get("/api/reports/:reportId/live", async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const { 
    start, 
    end, 
    grain,
    accountId, googleAdsId, facebookAdsId, ga4Id, shopifyId, instagramId, facebookPageId 
  } = req.query;

  const report = allAggregateReports.find((r) => r.id === reportId);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  // Account Resolution
  const accountIds: string[] = [];
  if (accountId) accountIds.push(String(accountId));
  if (googleAdsId) accountIds.push(String(googleAdsId));
  if (facebookAdsId) accountIds.push(String(facebookAdsId));
  if (ga4Id) accountIds.push(String(ga4Id));
  if (shopifyId) accountIds.push(String(shopifyId));
  if (instagramId) accountIds.push(String(instagramId));
  if (facebookPageId) accountIds.push(String(facebookPageId));

  const uniqueIds = Array.from(new Set(accountIds));
  if (uniqueIds.length === 0) {
    return res.status(400).json({ error: "At least one account ID is required" });
  }

  // Date Range Defaults (This Month)
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const startDate = (start as string) || defaultStart;
  const endDate = (end as string) || defaultEnd;
  const timeGrain = (grain as string) === 'daily' ? 'daily' : 'total';

  try {
    const bq = createBigQueryClient();
    
    // Build SQL using shared builder
    const sql = buildReportQuery(report, {
      startDate,
      endDate,
      accountIds: uniqueIds,
      timeGrain
    });

    console.log(`Executing live report query for ${reportId} (${timeGrain})`);
    
    const [rows] = await bq.query({
      query: sql,
      params: { accountIds: uniqueIds },
    });

    if (timeGrain === 'daily') {
      if (rows.length === 0) {
        return res.json({ headers: [], rows: [], totals: {} });
      }

      const allDates = getDatesInRange(startDate, endDate);
      const sample = rows[0];
      const excluded = ['account_id', 'date', 'partition', 'cluster'];
      const dimensions = Object.keys(sample).filter(k => !excluded.includes(k) && typeof sample[k] === 'string');
      const metrics = Object.keys(sample).filter(k => typeof sample[k] === 'number');

      const groups: Record<string, any> = {};

      rows.forEach(row => {
        const groupKey = dimensions.map(d => row[d]).join('||');
        if (!groups[groupKey]) {
          groups[groupKey] = {
            _key: groupKey,
            _dailyMap: {} as Record<string, any>,
            ...dimensions.reduce((acc, d) => ({ ...acc, [d]: row[d] }), {}),
            ...metrics.reduce((acc, m) => ({ ...acc, [m]: 0 }), {})
          };
        }

        const dateStr = row.date && typeof row.date === 'object' && 'value' in row.date ? row.date.value : row.date;
        if (dateStr) {
          groups[groupKey]._dailyMap[dateStr] = row;
        }

        metrics.forEach(m => {
          groups[groupKey][m] += (row[m] || 0);
        });
      });

      const processedRows = Object.values(groups).map(row => {
        row._daily = allDates.map(date => {
          const entry = row._dailyMap[date];
          return entry || metrics.reduce((acc, m) => ({ ...acc, [m]: 0 }), { date });
        });
        delete row._dailyMap;

        // Recalculate Rates (simplified backend logic)
        if (row.spend !== undefined && row.revenue !== undefined && row.spend > 0) row.roas = row.revenue / row.spend;
        if (row.conversions_value !== undefined && row.spend !== undefined && row.spend > 0) row.roas = row.conversions_value / row.spend;
        if (row.clicks !== undefined && row.impressions !== undefined && row.impressions > 0) row.ctr = row.clicks / row.impressions;
        if (row.spend !== undefined && row.conversions !== undefined && row.conversions > 0) row.cpa = row.spend / row.conversions;
        if (row.revenue !== undefined && row.orders !== undefined && row.orders > 0) row.aov = row.revenue / row.orders;
        if (row.engaged_sessions !== undefined && row.sessions !== undefined && row.sessions > 0) row.engagement_rate = row.engaged_sessions / row.sessions;

        return row;
      });

      // Headers
      const formatLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      const getSparklineMetric = (row: any) => {
        if (row._daily[0]?.spend !== undefined) return 'spend';
        if (row._daily[0]?.revenue !== undefined) return 'revenue';
        if (row._daily[0]?.impressions !== undefined) return 'impressions';
        if (row._daily[0]?.sessions !== undefined) return 'sessions';
        return Object.keys(row).find(k => typeof row[k] === 'number' && k !== 'account_id') || '';
      };

      const sparklineMetric = processedRows.length ? getSparklineMetric(processedRows[0]) : '';

      const headers = [
        ...dimensions.map(d => ({ key: d, label: formatLabel(d), type: 'dimension' })),
        { key: '_sparkline', label: `${formatLabel(sparklineMetric)} Trend`, type: 'sparkline', metric: sparklineMetric },
        ...metrics.filter(m => !m.includes('rate') && !m.includes('roas') && !m.includes('ctr') && !m.includes('aov') && !m.includes('cpa')).map(m => ({ key: m, label: formatLabel(m), type: 'metric' })),
        ...metrics.filter(m => m.includes('rate') || m.includes('roas') || m.includes('ctr') || m.includes('aov') || m.includes('cpa')).map(m => ({ key: m, label: formatLabel(m), type: 'rate' }))
      ];

      // Totals
      const totals: Record<string, number> = {};
      const dailyTotals: Record<string, number[]> = {}; // metric -> [val, val, ...] (aligned with allDates)

      metrics.forEach(m => {
        totals[m] = processedRows.reduce((acc, r) => acc + (r[m] || 0), 0);
        
        // Aggregate daily values across all rows
        dailyTotals[m] = allDates.map((date, idx) => {
            return processedRows.reduce((acc, row) => acc + (row._daily[idx]?.[m] || 0), 0);
        });
      });

      return res.json({ headers, rows: processedRows, totals, dailyTotals });
    }

    res.json(rows);
  } catch (error) {
    console.error(`Error executing live report ${reportId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/executive/summary", async (req: Request, res: Response) => {
  const { accountId, googleAdsId, facebookAdsId, ga4Id, shopifyId, instagramId, facebookPageId, days = "30" } = req.query;

  const adsAccountIds: string[] = [];
  if (googleAdsId) adsAccountIds.push(String(googleAdsId));
  if (facebookAdsId) adsAccountIds.push(String(facebookAdsId));

  const shopifyAccountIds: string[] = [];
  if (shopifyId) shopifyAccountIds.push(String(shopifyId));

  const uniqueAdsIds = Array.from(new Set(adsAccountIds));
  const uniqueShopifyIds = Array.from(new Set(shopifyAccountIds));

  if (uniqueAdsIds.length === 0 && uniqueShopifyIds.length === 0) {
    return res.status(400).json({ error: "At least one platform ID is required" });
  }

  const lookback = parseInt(String(days));

  try {
    const bq = createBigQueryClient();

    // SQL for Spend (Ads)
    const spendQuery = `
      WITH current_period AS (
        SELECT SUM(spend) as spend
        FROM \`entities.ads_daily\`
        WHERE account_id IN UNNEST(@accountIds)
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
      ),
      prev_period AS (
        SELECT SUM(spend) as spend
        FROM \`entities.ads_daily\`
        WHERE account_id IN UNNEST(@accountIds)
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL (@days * 2) DAY)
        AND date < DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
      )
      SELECT 
        COALESCE(c.spend, 0) as current_spend,
        COALESCE(p.spend, 0) as prev_spend
      FROM current_period c, prev_period p
    `;

    // SQL for Revenue (Shopify)
    const revenueQuery = `
      WITH current_period AS (
        SELECT 
          SUM(revenue) as revenue,
          SUM(CASE WHEN customer_type = 'new' THEN revenue ELSE 0 END) as new_rev
        FROM \`entities.shopify_daily\`
        WHERE account_id IN UNNEST(@accountIds)
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
      ),
      prev_period AS (
        SELECT 
          SUM(revenue) as revenue,
          SUM(CASE WHEN customer_type = 'new' THEN revenue ELSE 0 END) as new_rev
        FROM \`entities.shopify_daily\`
        WHERE account_id IN UNNEST(@accountIds)
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL (@days * 2) DAY)
        AND date < DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
      )
      SELECT 
        COALESCE(c.revenue, 0) as current_revenue,
        COALESCE(p.revenue, 0) as prev_revenue,
        COALESCE(c.new_rev, 0) as current_new_rev,
        COALESCE(p.new_rev, 0) as prev_new_rev
      FROM current_period c, prev_period p
    `;

    const spendPromise = uniqueAdsIds.length > 0
      ? bq.query({ query: spendQuery, params: { accountIds: uniqueAdsIds, days: lookback } })
      : Promise.resolve([[{ current_spend: 0, prev_spend: 0 }]] as any);

    const revPromise = uniqueShopifyIds.length > 0
      ? bq.query({ query: revenueQuery, params: { accountIds: uniqueShopifyIds, days: lookback } })
      : Promise.resolve([[{ current_revenue: 0, prev_revenue: 0, current_new_rev: 0, prev_new_rev: 0 }]] as any);

    const [[spendRows], [revRows]] = await Promise.all([spendPromise, revPromise]);

    const currentSpend = spendRows[0]?.current_spend || 0;
    const prevSpend = spendRows[0]?.prev_spend || 0;
    const currentRev = revRows[0]?.current_revenue || 0;
    const prevRev = revRows[0]?.prev_revenue || 0;
    const currentNewRev = revRows[0]?.current_new_rev || 0;
    const prevNewRev = revRows[0]?.prev_new_rev || 0;

    const currentMer = currentSpend > 0 ? currentRev / currentSpend : 0;
    const prevMer = prevSpend > 0 ? prevRev / prevSpend : 0;

    const merChange = prevMer > 0 ? ((currentMer - prevMer) / prevMer) * 100 : 0;
    const spendChange = prevSpend > 0 ? ((currentSpend - prevSpend) / prevSpend) * 100 : 0;
    const revChange = prevRev > 0 ? ((currentRev - prevRev) / prevRev) * 100 : 0;

    const acquisitionPct = currentRev > 0 ? (currentNewRev / currentRev) * 100 : 0;
    const prevAcquisitionPct = prevRev > 0 ? (prevNewRev / prevRev) * 100 : 0;
    const acquisitionChange = acquisitionPct - prevAcquisitionPct;

    res.json({
      scorecard: {
        mer: { value: currentMer, change: merChange },
        spend: { value: currentSpend, change: spendChange },
        revenue: { value: currentRev, change: revChange },
        acquisition: { value: acquisitionPct, change: acquisitionChange, newRevenue: currentNewRev }
      },
      period: `${lookback}d`
    });
  } catch (error) {
    console.error("Error fetching executive summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/aggregateReports/pmax-spend-breakdown", async (req: Request, res: Response) => {
  const { accountId } = req.query;
  if (!accountId) return res.status(400).json({ error: "accountId required" });
  try {
    const rows = await pmaxSpendBreakdown.getData(String(accountId), 200);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching pmax breakdown report:", error);
    res.json([]);
  }
});

app.get("/api/aggregateReports/ads-spend-breakdown", async (req: Request, res: Response) => {
  const { accountId, googleAdsId, facebookAdsId, ga4Id } = req.query;

  const accountIds: string[] = [];
  if (accountId) accountIds.push(String(accountId));
  if (googleAdsId) accountIds.push(String(googleAdsId));
  if (facebookAdsId) accountIds.push(String(facebookAdsId));
  if (ga4Id) accountIds.push(String(ga4Id));

  const uniqueIds = Array.from(new Set(accountIds));

  if (uniqueIds.length === 0) {
    return res.status(400).json({ error: "At least one account ID is required" });
  }

  try {
    const bq = createBigQueryClient();
    const query = `
      SELECT *
      FROM \`reports.ads_spend_breakdown\`
      WHERE account_id IN UNNEST(@accountIds)
      AND detected_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
      ORDER BY spend DESC
    `;

    const [rows] = await bq.query({
      query,
      params: { accountIds: uniqueIds },
    });

    res.json(rows);
  } catch (error) {
    console.error("Error fetching unified ads spend breakdown report:", error);
    res.json([]);
  }
});

app.get("/api/reports/superlatives/months", async (_req: Request, res: Response) => {
  try {
    const bq = createBigQueryClient();
    const query = `
      SELECT DISTINCT period_label, period_start
      FROM \`reports.superlatives_monthly\`
      ORDER BY period_start DESC
    `;
    const [rows] = await bq.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching superlative months:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/reports/superlatives", async (req: Request, res: Response) => {
  const { accountId, googleAdsId, facebookAdsId, ga4Id, shopifyId, instagramId, facebookPageId, month } = req.query;

  const accountIds: string[] = [];
  if (accountId) accountIds.push(String(accountId));
  if (googleAdsId) accountIds.push(String(googleAdsId));
  if (facebookAdsId) accountIds.push(String(facebookAdsId));
  if (ga4Id) accountIds.push(String(ga4Id));
  if (shopifyId) accountIds.push(String(shopifyId));
  if (instagramId) accountIds.push(String(instagramId));
  if (facebookPageId) accountIds.push(String(facebookPageId));

  const uniqueIds = Array.from(new Set(accountIds));

  if (uniqueIds.length === 0) {
    return res.status(400).json({ error: "At least one account ID is required" });
  }

  try {
    const bq = createBigQueryClient();
    const rows = await fetchSuperlatives(bq, uniqueIds, month as string);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching superlatives:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/reports/generate-talking-points", async (req: Request, res: Response) => {
  let { superlatives, overviews, accountIds, month } = req.body;

  try {
    // If data is missing but context is provided, fetch it server-side
    if ((!superlatives?.length && !overviews) && (accountIds?.length && month)) {
      console.log(`Fetching context data server-side for month: ${month}`);
      const bq = createBigQueryClient();
      
      // Fetch Superlatives
      superlatives = await fetchSuperlatives(bq, accountIds, month);
      
      // Fetch Overviews
      const dateRange = getDatesForMonth(month);
      if (dateRange) {
        overviews = await fetchOverviews(bq, accountIds, dateRange.start, dateRange.end);
      }
    }

    if ((!superlatives || !Array.isArray(superlatives)) && (!overviews || Object.keys(overviews || {}).length === 0)) {
      return res.status(400).json({ error: "Superlatives/Overviews data OR accountIds/month context is required" });
    }

    const systemInstruction = `${analystPrompt}\n\nIMPORTANT: You MUST return exactly 15 talking points in the following JSON format:
    {
      "talking_points": [
        {
          "title": "...",
          "victory": "...",
          "proof": "...",
          "impact": "...",
          "insights": "...",
          "referenced_superlative_index": number
        }
      ]
    }`;

    let prompt = `Here is the data for this month:`;
    
    if (superlatives && Array.isArray(superlatives) && superlatives.length > 0) {
      prompt += `\n\n=== SUPERLATIVES (HALL OF FAME) ===\n${JSON.stringify(superlatives)}`;
    }

    if (overviews && Object.keys(overviews).length > 0) {
      prompt += `\n\n=== PLATFORM OVERVIEWS (AGGREGATE PERFORMANCE) ===\n${JSON.stringify(overviews)}`;
    }
    
    const result = await generateStructuredContent<{
      talking_points: Array<{
        title: string;
        victory: string;
        proof: string;
        impact: string;
        insights: string;
        referenced_superlative_index: number;
      }>;
    }>(`${systemInstruction}\n\n${prompt}`);

    res.json(result.talking_points);
  } catch (error) {
    console.error("Error generating talking points:", error);
    res.status(500).json({ error: "Failed to generate talking points" });
  }
});

app.post("/api/reports/generate-draft", async (req: Request, res: Response) => {
  const { talkingPoints } = req.body;
  if (!talkingPoints || !Array.isArray(talkingPoints)) {
    return res.status(400).json({ error: "Talking points array is required" });
  }

  try {
    const prompt = `Here are the curated talking points to include in the report:\n${JSON.stringify(talkingPoints)}`;
    
    const result = await generateStructuredContent<any>(`${editorPrompt}\n\n${prompt}`);
    res.json(result);
  } catch (error) {
    console.error("Error generating draft:", error);
    res.status(500).json({ error: "Failed to generate draft" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  try {
    await clientAccountModel.initialize();
  } catch (err) {
    console.error("Failed to initialize clientAccountModel:", err);
  }
});