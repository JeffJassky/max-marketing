import { Entity } from "../../jobs/base";
import {
  createBigQueryClient,
  upsertPartitionedClusteredTable,
} from "../vendors/google/bigquery/bigquery";
import knex from "knex";

const qb = knex({ client: "pg" });

export interface SuperlativeRunOptions {
  startDate?: string;
  endDate?: string;
  // accountId removed, we will auto-discover
}

export class SuperlativeExecutor {
  constructor(private readonly projectId: string) {}

  async run(entities: Entity<any>[], options: SuperlativeRunOptions) {
    const bq = createBigQueryClient();
    const allResults: any[] = [];

    for (const entity of entities) {
      if (
        !entity.definition.superlatives ||
        entity.definition.superlatives.length === 0
      ) {
        continue;
      }

      console.log(`[SuperlativeExecutor] Processing entity: ${entity.id}`);
      const tableFqn = entity.fqn;

      // 1. Discover Accounts involved in this entity for the time range
      const accounts = await this.fetchAccounts(bq, tableFqn, options);
      console.log(`[SuperlativeExecutor] Found ${accounts.length} accounts to process.`);

      for (const accountId of accounts) {
        // console.log(`  > Processing account: ${accountId}`);

        for (const config of entity.definition.superlatives) {
          if (!config) continue;

                  for (const metric of config.targetMetrics) {
                    const metricDef = entity.definition.metrics[metric];
                    
                    if (!metricDef && !config.expression) {
                      console.warn(
                        `[SuperlativeExecutor] Metric ${metric} not found in entity ${entity.id}`
                      );
                      continue;
                    }
          
                    const aggregation = config.expression
                      ? config.expression
                      : `${metricDef!.aggregation.toUpperCase()}(${qb.raw(metric)})`;
            const rankType = config.rank_type || "highest";
            const orderDir = rankType === "lowest" ? "ASC" : "DESC";

            // Build Query
            // Use Raw for everything to ensure BigQuery compatibility with backticks
            let query = qb
              .select(
                qb.raw(`${config.dimensionId} as item_id`),
                qb.raw(`${config.dimensionLabel} as item_name`),
                qb.raw(`${aggregation} as metric_value`)
              )
              .from(qb.raw(`\`${tableFqn}\``))
              .whereRaw("account_id = ?", [accountId])
              .whereRaw(`${config.dimensionLabel} IS NOT NULL`)
              .whereRaw(`${config.dimensionLabel} != ''`)
              .groupByRaw(`${config.dimensionId}, ${config.dimensionLabel}`)
              .havingRaw(`${aggregation} > 0`)
              .orderByRaw(`metric_value ${orderDir}`)
              .limit(1);

            if (options.startDate) {
              query = query.whereRaw("date >= ?", [options.startDate]);
            }
            if (options.endDate) {
              query = query.whereRaw("date <= ?", [options.endDate]);
            }

            const sql = query.toQuery();

            try {
              const [rows] = await bq.query({ query: sql });

              if (rows.length > 0) {
                const winner = rows[0];
                allResults.push({
                  report_date: new Date().toISOString().split("T")[0],
                  account_id: accountId,
                  time_period: this.getTimePeriodLabel(options),
                  entity_type: entity.id,
                  dimension: config.dimensionLabel, // e.g. "campaign_name"
                  item_name: winner.item_name,
                  item_id: String(winner.item_id),
                  metric_name: metric,
                  metric_value: winner.metric_value,
                  rank_type: rankType,
                  detected_at: new Date().toISOString(),
                });
              }
            } catch (err: any) {
              console.error(
                `[SuperlativeExecutor] Error querying ${entity.id} for ${metric} (Account: ${accountId}):`,
                err.message
              );
            }
          }
        }
      }
    }

    if (allResults.length > 0) {
      console.log(
        `[SuperlativeExecutor] Writing ${allResults.length} superlatives to BigQuery...`
      );
      await upsertPartitionedClusteredTable(allResults, {
        datasetId: "reports",
        tableId: "superlatives",
        partitionField: "detected_at",
        clusteringFields: ["account_id", "entity_type", "metric_name"],
      });
    } else {
      console.log(`[SuperlativeExecutor] No superlatives found.`);
    }
  }

  private async fetchAccounts(
    bq: any,
    tableFqn: string,
    options: SuperlativeRunOptions
  ): Promise<string[]> {
    let query = qb
      .select(qb.raw("account_id"))
      .distinct()
      .from(qb.raw(`\`${tableFqn}\``));

    if (options.startDate) {
      query = query.whereRaw("date >= ?", [options.startDate]);
    }
    if (options.endDate) {
      query = query.whereRaw("date <= ?", [options.endDate]);
    }

    const sql = query.toQuery();

    try {
      const [rows] = await bq.query({ query: sql });
      return rows.map((r: any) => r.account_id);
    } catch (err: any) {
      console.error(
        `[SuperlativeExecutor] Failed to fetch accounts from ${tableFqn}:`,
        err.message
      );
      return [];
    }
  }

  private getTimePeriodLabel(options: SuperlativeRunOptions): string {
    if (!options.startDate) return "all_time";
    return "custom_range";
  }
}