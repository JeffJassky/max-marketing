import "dotenv/config";
import { clientAccountModel } from "../src/server/models/ClientAccount";
import { createBigQueryClient } from "../src/shared/vendors/google/bigquery/bigquery";

async function migrate() {
  const bq = createBigQueryClient();
  const query = `ALTER TABLE 
${clientAccountModel.fqn}
 ADD COLUMN IF NOT EXISTS ga4Id STRING`;
  
  console.log(`Running migration: ${query}`);
  try {
    await bq.query(query);
    console.log("Migration successful: ga4Id column added.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
