import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createBigQueryClient } from "../shared/vendors/google/bigquery/bigquery";
import { wastedSpendKeyword } from "../jobs/entities/keyword-daily/signals/wasted-spend-keyword.signal";
import { broadMatchDriftSearchTerm } from "../jobs/entities/keyword-daily/signals/broad-match-drift.signal";
import { lowPerformingKeyword } from "../jobs/entities/keyword-daily/signals/low-performing-keyword.signal";
import { googleAdsCoreKeywordPerformance } from "../jobs/imports/google_ads/core-keyword-performance.import";

const app = express();
app.use(express.json());

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

app.get(
  "/api/signals/wasted-keyword-spend",
  async (req: Request, res: Response) => {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }

    try {
      const signal = wastedSpendKeyword;

      const rows = await signal.getRows({ accountId: accountId as string });
      res.json(rows);
    } catch (error) {
      console.error("Error fetching wasted keyword spend signal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get(
  "/api/signals/low-performing-keyword",
  async (req: Request, res: Response) => {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }

    try {
      const signal = lowPerformingKeyword;

      const rows = await signal.getRows({ accountId: accountId as string });

      res.json(rows);
    } catch (error) {
      console.error("Error fetching low performing keyword signal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get(
  "/api/signals/broad-match-drift-search-term",
  async (req: Request, res: Response) => {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }

    try {
      const signal = broadMatchDriftSearchTerm;

      const rows = await signal.getRows({ accountId: accountId as string });
      res.json(rows);
    } catch (error) {
      console.error(
        "Error fetching broad match drift search term signal:",
        error
      );
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
