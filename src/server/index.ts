import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createBigQueryClient } from "../shared/vendors/google/bigquery/bigquery";
import { googleAdsCoreKeywordPerformance } from "../jobs/imports/google_ads/core-keyword-performance.import";
import { facebookAdsInsights } from "../jobs/imports/facebook_ads/insights.import";
import { ga4PagePerformance } from "../jobs/imports/google_ga4/page-performance.import";

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
import { pmaxSpendBreakdown } from "../jobs/entities/pmax-daily/aggregateReports/pmax-spend-breakdown.aggregateReport";
import { adsSpendBreakdown } from "../jobs/entities/ads-daily/aggregateReports/ads-spend-breakdown.aggregateReport";
import { clientAccountModel } from "./models/ClientAccount";

const app = express();
app.use(express.json());

// Helper to list core monitors
const coreMonitors = [
  accountSpendAnomalyMonitor,
  accountConversionDropMonitor,
  activePmaxCampaignMonitor,
  activeAdsCampaignMonitor,
  wastedSpendConversionMonitor,
  wastedSpendClickMonitor,
  highCPAMonitor,
  lowROASMonitor,
  broadMatchDriftMonitor,
];

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

    const [googleRowsPromise, facebookRowsPromise, ga4RowsPromise] = [
      bq.query(googleQuery),
      bq.query(facebookQuery),
      bq.query(ga4Query),
    ];

    const [[googleRows], [facebookRows], [ga4Rows]] = await Promise.all([
      googleRowsPromise,
      facebookRowsPromise,
      ga4RowsPromise,
    ]);

    res.json({
      google: googleRows,
      facebook: facebookRows,
      ga4: ga4Rows,
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

      const rows = await monitor.getAnomalies(uniqueIds[0], 50);
      return res.json(rows);
    }

    // Unified feed
    const flat = await Monitor.getUnifiedAnomalies(
      coreMonitors,
      uniqueIds[0],
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
      AND detected_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
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
  const { accountId, googleAdsId, facebookAdsId, ga4Id, month } = req.query;

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
    
    let monthFilter = "";
    if (month) {
      monthFilter = "AND period_label = @month";
    } else {
      // Default to most recent month
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
      params: { accountIds: uniqueIds, month: month || null },
    });

    res.json(rows);
  } catch (error) {
    console.error("Error fetching superlatives:", error);
    res.status(500).json({ error: "Internal server error" });
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