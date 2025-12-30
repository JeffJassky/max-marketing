import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createBigQueryClient } from "../shared/vendors/google/bigquery/bigquery";
import { googleAdsCoreKeywordPerformance } from "../jobs/imports/google_ads/core-keyword-performance.import";
import { facebookAdsInsights } from "../jobs/imports/facebook_ads/insights.import";

import { Monitor } from "../shared/data/monitor";
import { accountSpendAnomalyMonitor } from "../jobs/entities/campaign-daily/monitors/account-spend-anomaly.monitor";
import { accountConversionDropMonitor } from "../jobs/entities/campaign-daily/monitors/account-conversion-drop.monitor";
import { activePmaxCampaignMonitor } from "../jobs/entities/pmax-daily/monitors/active-pmax-campaign.monitor";
import { activeFacebookCampaignMonitor } from "../jobs/entities/facebook-spend-daily/monitors/active-facebook-campaign.monitor";
import { wastedSpendConversionMonitor } from "../jobs/entities/keyword-daily/monitors/wasted-spend-conversion.monitor";
import { wastedSpendClickMonitor } from "../jobs/entities/keyword-daily/monitors/wasted-spend-click.monitor";
import { highCPAMonitor } from "../jobs/entities/keyword-daily/monitors/high-cpa.monitor";
import { lowROASMonitor } from "../jobs/entities/keyword-daily/monitors/low-roas.monitor";
import { broadMatchDriftMonitor } from "../jobs/entities/keyword-daily/monitors/broad-match-drift.monitor";
import { pmaxSpendBreakdown } from "../jobs/entities/pmax-daily/aggregateReports/pmax-spend-breakdown.aggregateReport";
import { googleSpendBreakdown } from "../jobs/entities/campaign-daily/aggregateReports/google-spend-breakdown.aggregateReport";
import { facebookSpendBreakdown } from "../jobs/entities/facebook-spend-daily/aggregateReports/facebook-spend-breakdown.aggregateReport";

const app = express();
app.use(express.json());

// Helper to list core monitors
const coreMonitors = [
  accountSpendAnomalyMonitor,
  accountConversionDropMonitor,
  activePmaxCampaignMonitor,
  activeFacebookCampaignMonitor,
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

    const [googleRowsPromise, facebookRowsPromise] = [
      bq.query(googleQuery),
      bq.query(facebookQuery),
    ];

    const [[googleRows], [facebookRows]] = await Promise.all([
      googleRowsPromise,
      facebookRowsPromise,
    ]);

    res.json({
      google: googleRows,
      facebook: facebookRows,
    });
  } catch (error) {
    console.error("Error fetching platform accounts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/accounts", async (_req: Request, res: Response) => {
  try {
    const bq = createBigQueryClient();
    const sourceTable = googleAdsCoreKeywordPerformance;
    const query = `
			SELECT
				account_id AS id,
				ANY_VALUE(account_name) AS name
			FROM
				${sourceTable.fqn}
			WHERE account_id IS NOT NULL
			GROUP BY account_id
		`;
    const [rows] = await bq.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/monitors/anomalies", async (req: Request, res: Response) => {
  const { accountId, googleAdsId, facebookAdsId, monitorId } = req.query;

  const accountIds: string[] = [];
  if (accountId) accountIds.push(String(accountId));
  if (googleAdsId) accountIds.push(String(googleAdsId));
  if (facebookAdsId) accountIds.push(String(facebookAdsId));

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

app.get("/api/aggregateReports/google-spend-breakdown", async (req: Request, res: Response) => {
  const { accountId } = req.query;
  if (!accountId) return res.status(400).json({ error: "accountId required" });
  try {
    const rows = await googleSpendBreakdown.getData(String(accountId), 200);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching google spend breakdown report:", error);
    res.json([]);
  }
});

app.get("/api/aggregateReports/facebook-spend-breakdown", async (req: Request, res: Response) => {
  const { accountId } = req.query;
  if (!accountId) return res.status(400).json({ error: "accountId required" });
  try {
    const rows = await facebookSpendBreakdown.getData(String(accountId), 200);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching facebook spend breakdown report:", error);
    res.json([]);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
