import "dotenv/config";
import { createBigQueryClient } from "../../shared/vendors/google/bigquery/bigquery";
import { windsorAccessTokenModel } from "../models/WindsorAccessToken";

const TOKENS = [
  "YVQvDwXkFckSXUHbIJuNUe4IO3aPamTMs6GsKeYowG",
  "ryFmStvUWQs7HVfbis8kbhCMcoKnEnyoMizntVfTN0",
  "vUgfvrBwhSdUEW3H5SRrC0cIH3o9UF2KAc1UXqrq9G",
  "mvwhVeRYsZtgNwwi2pCUx1l3SJreTColbi0JmAIVC6",
  "3TuQ2OZ4b9Mjp4Mf0PYT5Y6Y7eXj7BdVWGH6kEmMhg",
  "uKaOUix4BDOyRtfEul9faU1Gbu8M1wTHw7wljxpcjc",
  "IovfDsq3gk6SyHTrBEaf0zPAnUVwsMlelhbHvV8UyA",
  "yikE3jXCdmmb9fl0FGO3IuABLyKCPBSZO6DPM1yvXs",
  "N1F1gJxplkzO0vbeiJyC7cLFscvyV12HRtcGF8yWe4",
  "CEYbWjecELCLu3PNsHSCtwF1lL8KDgeooF6waE1tfX",
  "raj0m79vkfc0ltZMVFKmGY5DQnPTxYHJ607ek0pMaW",
  "77PfLJo3CG9f8THdxTrzYM4XYGz6XmPJCLZ8hWTrOj",
  "RUIcVxZ4ALdAxOd0KsCzvVSSQEvWsVfHLtYcvGSZxX",
  "ws87ZssIp3BBg18z1O5X1alqU8kNLIflWVvTIxDff0",
  "cTAJLbvBmIOjO2TCUBNWEE6paTFzCEgpkudjIeKsxZ",
  "bF2K4Wxx1eT8hovOr2tSLUBrZ1Rw2gVPL2hu0GYqRz",
  "1KJT9dl1LDjPHhEGuikhbCIxymrKtLYZjaQTi4oqqr",
  "R0HeguftcRCDfTOsJUqECbyRKguFaeFQqmPb2W47Hh",
  "sK8mBZDF7KLfHVsPOG9Xywj5YWhoialwgkUJ4vozsz",
];

async function seed() {
  const bq = createBigQueryClient();
  const fqn = windsorAccessTokenModel.fqn;

  // Ensure the table exists
  await windsorAccessTokenModel.initialize();

  // Drop and recreate table to clear streaming buffer, then use DML INSERT
  // (streaming inserts create a buffer that blocks UPDATE/DELETE for ~90 min)
  console.log(`Dropping and recreating table ${fqn} to clear streaming buffer...`);
  const [dataset] = await bq.dataset("app_data").get();
  const tableRef = dataset.table("windsor_access_tokens");
  const [exists] = await tableRef.exists();
  if (exists) {
    await tableRef.delete();
    console.log("  Table dropped.");
  }
  await windsorAccessTokenModel.initialize();
  console.log("  Table recreated.");

  // Use DML INSERT (not streaming API) so rows are immediately updatable
  console.log(`Inserting ${TOKENS.length} tokens via DML...`);

  const values = TOKENS.map(
    (t) => `('${t}', NULL, 'available', NULL)`,
  ).join(",\n    ");

  const query = `
    INSERT INTO ${fqn} (access_token, maxed_account_id, status, assigned_at)
    VALUES
    ${values}
  `;

  await bq.query({ query });
  console.log("Done. Token pool seeded successfully (DML — no streaming buffer).");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
