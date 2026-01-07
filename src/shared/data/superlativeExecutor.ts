import { Entity } from "../../jobs/base";
import {
  createBigQueryClient,
  upsertPartitionedClusteredTable,
} from "../vendors/google/bigquery/bigquery";
import knex from "knex";
import { clientAccountModel } from "../../server/models/ClientAccount";
import { SuperlativeItem, AwardDefinition } from "./types";

const qb = knex({ client: "pg" });

export interface SuperlativeRunOptions {
  lookbackMonths?: number;
}

interface AccountGroup {
  logicalId: string; // Could be "allparts" or "12345" (if unmapped)
  accountIds: string[];
}

interface DateRange {
  start: string;
  end: string;
  label: string;
}

export class SuperlativeExecutor {
  constructor(private readonly projectId: string) {}

  async run(entities: Entity<any>[], options: SuperlativeRunOptions) {
    const bq = createBigQueryClient();
    const allResults: any[] = [];
    const lookbackMonths = options.lookbackMonths || 3;
    
    // We get ranges in REVERSE chronological order (Newest first) by default from getMonthlyRanges
    // But for history building, we need CHRONOLOGICAL order (Oldest -> Newest)
    const ranges = this.getMonthlyRanges(lookbackMonths).reverse();

    const entityIds = entities.map(e => e.id);
    console.log(
      `[SuperlativeExecutor] Running for ${lookbackMonths} months (Chronological): ${ranges
        .map((r) => r.label)
        .join(" -> ")}`
    );

    // Prepare to clear old data for these periods and entities to ensure idempotency
    await this.deletePeriods(bq, "reports.superlatives_monthly", ranges, entityIds);

    // HISTORY CACHE: Map<"accountId_entity_metric_itemId", SuperlativeItem[]>
    // Stores the history of items to calculate streaks/deltas as we move forward in time
    const historyCache = new Map<string, SuperlativeItem[]>();

    for (const range of ranges) {
      console.log(`[SuperlativeExecutor] Processing month: ${range.label}`);

      for (const entity of entities) {
        if (
          !entity.definition.superlatives ||
          entity.definition.superlatives.length === 0
        ) {
          continue;
        }

        const tableFqn = entity.fqn;
        const accountGroups = await this.fetchAccountGroups(bq, tableFqn, range);

        for (const group of accountGroups) {
          for (const config of entity.definition.superlatives) {
            if (!config) continue;

            const limit = config.limit || 3;
            // Use dimensionNameField for the SQL selection, fallback to dimensionId
            const nameField = config.dimensionNameField || config.dimensionId;
        
                    for (const metricConfig of config.metrics) {
                      const {
                        metric,
                        expression,
                        rank_type: rankType = "highest",
                        awards = [],
                      } = metricConfig;
        
                      const metricDef = entity.definition.metrics[metric];
        
                      if (!metricDef && !expression) {
                        console.warn(
                          `[SuperlativeExecutor] Metric ${metric} not found in entity ${entity.id}`
                        );
                        continue;
                      }
        
                      const aggregationSql = expression
                        ? expression
                        : `${metricDef!.aggregation.toUpperCase()}(${metric})`;
        
                      const orderDir = rankType === "lowest" ? "ASC" : "DESC";
        
                      // Build Query
                      const idList = group.accountIds.map((id) => `'${id}'`).join(",");
                      let query = qb
                        .select(
                          qb.raw(`${aggregationSql} as metric_value`),
                          qb.raw(`${config.dimensionId} as item_id`),
                          qb.raw(`${nameField} as item_name`)
                        )
                        .from(qb.raw(`\`${tableFqn}\``))
                        .whereRaw(`account_id IN (${idList})`)
                        .whereRaw(`${nameField} IS NOT NULL`)
                        .whereRaw(`${nameField} != ''`)
                        .whereRaw("date >= ?", [range.start])
                        .whereRaw("date <= ?", [range.end])
                        .groupByRaw(
                          `${config.dimensionId}, ${nameField}`
                        )
                        .havingRaw(`${aggregationSql} > 0`)
                        .orderByRaw(`metric_value ${orderDir}`)
                        .limit(limit);
                      const sql = query.toQuery();

              try {
                const [rows] = await bq.query({ query: sql });

                if (rows.length > 0) {
                  rows.forEach((winner: any, index: number) => {
                    const position = index + 1;
                    
                    // --- HISTORY & ENRICHMENT ---
                    // Use group.logicalId instead of winner.account_id for the cache key
                    const cacheKey = `${group.logicalId}_${entity.id}_${metric}_${winner.item_id}`;
                    const itemHistory = historyCache.get(cacheKey) || [];
                    const previousItem = itemHistory[0]; // The most recent one (since we unshift)

                    // 1. Calculate Stats
                    const previous_position = previousItem ? previousItem.position : undefined;
                    const rank_delta = previousItem ? (previousItem.position - position) : 0;
                    
                    // Peak: Min of current position vs historical peak
                    const historicalPeak = previousItem?.peak_position ?? 999;
                    const peak_position = Math.min(position, historicalPeak);

                    // Streak
                    const periods_on_chart = previousItem ? (previousItem.periods_on_chart || 1) + 1 : 1;

                    // 2. Build Item
                    const currentItem: SuperlativeItem = {
                      account_id: group.logicalId, // Store the logical group ID
                      item_id: String(winner.item_id),
                      item_name: winner.item_name,
                      metric_value: winner.metric_value,
                      position: position,
                      period_start: range.start,
                      previous_position,
                      rank_delta,
                      peak_position,
                      periods_on_chart
                    };

                    // 3. Evaluate Awards
                    const wonAwards: string[] = [];
                    if (awards && awards.length > 0) {
                      awards.forEach((awardDef: AwardDefinition) => {
                         const result = awardDef.evaluate({
                           currentItem,
                           previousItem,
                           history: itemHistory
                         });
                         
                         if (result) {
                           wonAwards.push(awardDef.id);
                         }
                      });
                    }

                    // 4. Update Cache (Add current to front of history)
                    historyCache.set(cacheKey, [currentItem, ...itemHistory]);

                    // 5. Push Result
                    allResults.push({
                      ...currentItem,
                      report_date: new Date().toISOString().split("T")[0],
                      period_end: range.end,
                      period_label: range.label,
                      time_period: range.label,
                      
                      group_id: group.logicalId,
                      entity_type: entity.id,
                      entity_label: entity.definition.label || entity.id,
                      dimension: config.dimensionLabel,
                      metric_name: metric,
                      rank_type: rankType,
                      
                      awards: wonAwards,
                      
                      detected_at: new Date().toISOString(),
                    });
                  });
                }
              } catch (err: any) {
                console.error(
                  `[SuperlativeExecutor] Error querying ${entity.id} for ${metric} (Group: ${group.logicalId}):`,
                  err.message
                );
              }
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
        tableId: "superlatives_monthly",
        partitionField: "period_start",
        clusteringFields: ["account_id", "entity_type", "metric_name"],
      });
    } else {
      console.log(`[SuperlativeExecutor] No superlatives found.`);
    }
  }

  private async deletePeriods(bq: any, tableId: string, ranges: DateRange[], entityIds: string[]) {
    // Construct a DELETE query for the periods and entities we are about to re-process
    const periods = ranges.map(r => `'${r.start}'`).join(',');
    const ids = entityIds.map(id => `'${id}'`).join(',');
    const query = `DELETE FROM \`${this.projectId}.${tableId}\` WHERE period_start IN (${periods}) AND entity_type IN (${ids})`;
    
    try {
      // Check if table exists first to avoid error
      const [exists] = await bq.dataset("reports").table(tableId.split('.')[1]).exists();
      if (exists) {
        console.log(`[SuperlativeExecutor] Clearing existing data for entities [${entityIds.join(', ')}] in periods: ${periods}`);
        await bq.query({ query });
      }
    } catch (e) {
      console.warn(`[SuperlativeExecutor] Failed to clear old data (might be first run):`, e);
    }
  }

  private async fetchAccountGroups(
    bq: any,
    tableFqn: string,
    range: DateRange
  ): Promise<AccountGroup[]> {
    // 1. Get all active accounts in the entity table for this specific range
    let query = qb
      .select(qb.raw("account_id"))
      .distinct()
      .from(qb.raw(`\`${tableFqn}\``))
      .whereRaw("date >= ?", [range.start])
      .whereRaw("date <= ?", [range.end]);

    const [activeRows] = await bq.query({ query: query.toQuery() });
    const activeAccountIds = new Set<string>(
      activeRows.map((r: any) => r.account_id)
    );

    // 2. Get mappings from app_data.accounts via model
    const finalGroups: AccountGroup[] = [];
    try {
      await clientAccountModel.initialize();
      const accounts = await clientAccountModel.findAll();

      for (const account of accounts) {
        const ids: string[] = [];
        if (account.googleAdsId) ids.push(account.googleAdsId);
        if (account.facebookAdsId) ids.push(account.facebookAdsId);
        if (account.ga4Id) ids.push(account.ga4Id);

        // Only include IDs that actually have data in this entity for the selected period
        const activeInGroup = ids.filter((id) => activeAccountIds.has(id));

        if (activeInGroup.length > 0) {
          finalGroups.push({
            logicalId: account.id,
            accountIds: activeInGroup,
          });
        }
      }
    } catch (e) {
      console.warn(
        `[SuperlativeExecutor] Could not load account mappings. Error: ${e instanceof Error ? e.message : e}`
      );
    }

    return finalGroups;
  }

  private getMonthlyRanges(count: number): DateRange[] {
    const ranges: DateRange[] = [];
    const today = new Date();
    
    // We start from current month and go backwards
    for (let i = 0; i < count; i++) {
      // i=0 -> Current Month
      // i=1 -> Last Month
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      
      const start = d.toISOString().split("T")[0];
      
      // End date: Last day of the month
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const end = nextMonth.toISOString().split("T")[0];
      
      // Label: YYYY-MM
      const label = start.substring(0, 7);
      
      ranges.push({ start, end, label });
    }
    return ranges;
  }
}