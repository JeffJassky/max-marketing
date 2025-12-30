import { MonitorDef, Measure } from "./types";
import { Entity } from "../../jobs/base";
import { createBigQueryClient } from "../vendors/google/bigquery/bigquery";
import snakeCase from "lodash/snakeCase";

export class Monitor {
  readonly id: string;
  readonly type = "monitor";
  
  constructor(
    public readonly definition: MonitorDef,
    public readonly measure: Measure,
    public readonly entity: Entity<any>
  ) {
    this.id = definition.id;
  }

  /**
   * Fetches anomalies for this specific monitor.
   */
  async getAnomalies(accountId: string, limit: number = 100) {
    const bq = createBigQueryClient();
    const tableName = snakeCase(this.id);
    const query = `
      SELECT *, '${tableName}' as source_table
      FROM \`anomalies.${tableName}\`
      WHERE account_id = @accountId
      ORDER BY detected_at DESC
      LIMIT @limit
    `;
    
    console.log(`[Monitor] Querying anomalies.${tableName} for account: ${accountId}`);
    
    try {
      const [rows] = await bq.query({
        query,
        params: { accountId, limit }
      });

      return rows.map(row => ({
          ...row,
          detected_at: typeof row.detected_at === 'object' && row.detected_at?.value 
              ? row.detected_at.value 
              : row.detected_at
      }));
    } catch (err: any) {
      if (err.message?.includes('Not found: Table')) {
        console.warn(`[Monitor] Table anomalies.${tableName} not found. Returning empty results.`);
        return [];
      }
      throw err;
    }
  }

  /**
   * Static helper to fetch and combine anomalies from multiple monitors.
   */
  static async getUnifiedAnomalies(monitors: Monitor[], accountId: string, limit: number = 100) {
      const promises = monitors.map(m => 
          m.getAnomalies(accountId, limit)
              .catch(err => {
                  console.warn(`Failed to fetch from monitor ${m.id}:`, err.message);
                  return [];
              })
      );

      const results = await Promise.all(promises);
      const flat = results.flat();

      // Sort combined results
      return flat.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  }
}
