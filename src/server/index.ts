import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createBigQueryClient } from "../shared/vendors/google/bigquery/bigquery";
import { wastedSpendKeyword } from "../jobs/signals";

const app = express();
app.use(express.json());

type AccountRow = { id: string | number; name?: string | null };
type AccountsResponse = { accounts: Array<{ id: string; name: string }> };

type SignalRow = Record<string, unknown>;
type SignalsResponse = { signals: SignalRow[] };

app.get(
  "/api/accounts",
  async (_req: Request, res: Response<AccountsResponse>) => {
    try {
      const bq = createBigQueryClient();
      const query = `
			SELECT
				account_id AS id,
				ANY_VALUE(account_name) AS name
			FROM \`amplify-11.bronze.google_ads_keyword_performance_v1\`
			WHERE account_id IS NOT NULL
			GROUP BY account_id
		`;

      const [rows] = await bq.query<AccountRow>(query);
      const accounts: AccountsResponse["accounts"] = rows.map((row) => {
        const id = String(row.id);
        return { id, name: row.name ?? id };
      });

      res.json(accounts);
    } catch (error) {
      console.error("Failed to fetch account IDs from BigQuery", error);
      res.status(500).json({ error: "Failed to fetch account IDs" });
    }
  }
);

app.get(
  "/api/signals/wasted-keyword-spend",
  async (req: Request, res: Response<SignalsResponse | { error: string }>) => {
    const accountId = req.query.account_id ?? req.query.accountId;
    if (!accountId || (Array.isArray(accountId) && accountId.length === 0)) {
      return res.status(400).json({ error: "account_id is required" });
    }

    const accountIdValue = Array.isArray(accountId) ? accountId[0] : accountId;

    try {
      const bq = createBigQueryClient();
      const snapshot = wastedSpendKeyword.snapshot;
      if (!snapshot) {
        return res
          .status(500)
          .json({ error: "Signal snapshot definition missing" });
      }

      const columns = new Set<string>();
      snapshot.attributionKey.forEach((key) => columns.add(key));
      Object.keys(snapshot.metrics).forEach((metricAlias) =>
        columns.add(metricAlias)
      );
      columns.add("bidding_strategy_type");
      columns.add("campaign_id");
      columns.add("campaign");
      columns.add("keyword_match_type");
      columns.add("goal");
      columns.add("impact");
      columns.add("confidence");
      columns.add("detected_at");
      columns.add("signal_id");

      const selectColumns = Array.from(columns).map((column) => `\`${column}\``);
      const selectClause = [
        "CONCAT(CAST(account_id AS STRING), '|', CAST(campaign_id AS STRING), '|', keyword_text, '|', IFNULL(bidding_strategy_type, '')) AS row_id",
        ...selectColumns,
      ].join(",\n\t\t\t\t");

      const accountField =
        snapshot.attributionKey.find((key) =>
          key.toLowerCase().includes("account_id")
        ) ?? "account_id";

      const query = `
				SELECT
					${selectClause}
				FROM \`gold_signals.${wastedSpendKeyword.id}\`
				WHERE \`${accountField}\` = @accountId
				ORDER BY detected_at DESC
				LIMIT 500
			`;

      const [rows] = await bq.query<SignalRow>({
        query,
        location: "US",
        params: { accountId: accountIdValue },
      });

      const signals = rows.map((row) => {
        const entries = Object.entries(row).map(([key, value]) => {
          if (value instanceof Date) {
            return [key, value.toISOString()];
          }
          return [key, value];
        });
        return Object.fromEntries(entries);
      });

      signals.sort((a, b) => b.impact - a.impact);

      res.json(signals);
    } catch (error) {
      console.error("Failed to fetch wasted keyword spend signals", error);
      res.status(500).json({ error: "Failed to fetch signals" });
    }
  }
);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
