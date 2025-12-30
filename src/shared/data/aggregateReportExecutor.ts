import {
  createBigQueryClient,
  upsertPartitionedClusteredTable,
} from "../vendors/google/bigquery/bigquery";
import { getDatasetInfo, resolveDatasetLocation } from "./bigQueryLocation";
import knex from "knex";
import type { AggregateReport } from "../../jobs/base";
import { predicateToSql } from "./predicateToSql";

const qb = knex({ client: "pg" }); // knex for SQL generation (BQ uses Standard SQL but this is fine for query text)

export interface AggregateReportRunOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  accountId?: string;
}

export class AggregateReportExecutor {
  constructor(private readonly projectId: string) {}

  // ======================================================
  // PUBLIC: Single entry point
  // ======================================================
  async run(
    aggregateReport: AggregateReport<any>,
    options: AggregateReportRunOptions = {}
  ): Promise<void> {
    const query = this.buildSnapshotQuery(aggregateReport, options);

    console.log(`Executing AggregateReport Job for ${aggregateReport.id}...`);
    console.log("Query:\n", query);

    const bq = createBigQueryClient();
    const sourceDataset = await getDatasetInfo(
      bq,
      aggregateReport.definition.source.dataset
    );
    const location = resolveDatasetLocation(sourceDataset);
    const [job] = await bq.createQueryJob({ query, location });
    const [rows] = await job.getQueryResults();

    console.log(`Found ${rows.length} aggregated aggregateReports.`);

    if (rows.length === 0) return;

    // Add metadata fields (schema includes these)
    const rowsToInsert = rows.map((row) => ({
      ...row,
      report_id: aggregateReport.id,
      detected_at: new Date().toISOString(),
    }));

    const clusteringFields =
      aggregateReport.definition.output.grain.map(String);
    const limitedClusteringFields = clusteringFields.slice(0, 4);
    if (clusteringFields.length > 4) {
      console.warn(
        `Clustering fields for aggregateReport ${
          aggregateReport.id
        } exceed BigQuery limit (4). Using first 4: ${limitedClusteringFields.join(
          ", "
        )}`
      );
    }

    await upsertPartitionedClusteredTable(rowsToInsert, {
      datasetId: aggregateReport.dataset, // aggregateReports
      tableId: aggregateReport.tableName, // e.g. wasted_spend_keyword
      partitionField: "detected_at",
      clusteringFields: limitedClusteringFields,
    });
  }

  // ======================================================
  // SNAPSHOT BUILDER (the real engine)
  // ======================================================
  private buildSnapshotQuery(
    aggregateReport: AggregateReport<any>,
    options: AggregateReportRunOptions
  ): string {
    const def = aggregateReport.definition;
    const entity = aggregateReport.definition.source;
    const table = entity.fqn;
    const groupByFields = def.output.grain.map(String);

    // ---------------------------------------
    // WINDOW RESOLUTION
    // ---------------------------------------
    const dateField = String(def.window?.dateDimension ?? "date");

    let windowStartSQL: string | undefined;

    if (options.startDate || options.endDate) {
      windowStartSQL = options.startDate ? `'${options.startDate}'` : undefined;
    } else if (def.window) {
      windowStartSQL = `DATE_SUB(CURRENT_DATE(), INTERVAL ${def.window.lookbackDays} DAY)`;
    }

    // ---------------------------------------
    // SELECT LIST
    // Must include:
    // - groupBy fields
    // - aggregated metrics
    // - derived fields
    // - metadata fields
    // ---------------------------------------
    const baseSelects: string[] = [];

    // GROUP BY fields
    groupByFields.forEach((dim) => {
      baseSelects.push(`${dim} AS ${dim}`);
    });

    // Non-key/pass-through dimensions
    def.output.includeDimensions?.forEach((dim) => {
      baseSelects.push(`ANY_VALUE(${String(dim)}) AS ${String(dim)}`);
    });

    // METRICS (entity-based or derived)
    const metricAliasMap: Record<string, string> = {}; // alias → alias (for HAVING)
    Object.entries(def.output.metrics).forEach(([alias, metric]) => {
      if (metric.expression) {
        // A derived metric expression like MAX(date)
        baseSelects.push(`${metric.expression} AS ${alias}`);
      } else {
        const sourceMetricName = (metric.sourceMetric ?? alias) as string;
        const entityMetric = entity.definition.metrics[sourceMetricName];

        if (entityMetric) {
          const agg = metric.aggregation ?? entityMetric.aggregation;
          baseSelects.push(
            `${agg.toUpperCase()}(${sourceMetricName}) AS ${alias}`
          );
        } else if (metric.aggregation) {
          baseSelects.push(
            `${metric.aggregation.toUpperCase()}(${sourceMetricName}) AS ${alias}`
          );
        }
      }
      metricAliasMap[alias] = alias;
    });

    // ---------------------------------------
    // BUILD BASE QUERY
    // ---------------------------------------
    const queryBuilder = qb
      .from(qb.raw(`\`${table}\``))
      .select(qb.raw(baseSelects.join(", ")));

    // WINDOW WHERE CLAUSE
    if (windowStartSQL) {
      queryBuilder.whereRaw(`${dateField} >= ${windowStartSQL}`);
    }

    if (options.endDate) {
      queryBuilder.whereRaw(`${dateField} <= '${options.endDate}'`);
    }

    if (options.accountId) {
      queryBuilder.whereRaw("account_id = ?", [options.accountId]);
    }

    // ---------------------------------------
    // GROUP BY
    // ---------------------------------------
    queryBuilder.groupBy(groupByFields.map((dim) => qb.raw(dim)));

    // ---------------------------------------
    // HAVING (TRANSLATED PREDICATE)
    // ---------------------------------------
    const having = predicateToSql(def.predicate, metricAliasMap);
    if (having && having.trim().length > 0) {
      queryBuilder.havingRaw(having);
    }

    const baseQuery = queryBuilder.toQuery();

    // ---------------------------------------
    // OUTER PROJECTION (DERIVED + METADATA)
    // ---------------------------------------
    const outerSelects: string[] = ["t.*"];

    if (def.output.derivedFields) {
      for (const [alias, cfg] of Object.entries(def.output.derivedFields)) {
        outerSelects.push(`${cfg.expression} AS ${alias}`);
      }
    }

    outerSelects.push(`'${def.id}' AS report_id`);
    outerSelects.push(`CURRENT_TIMESTAMP() AS detected_at`);

    const finalQuery = qb
      .from(qb.raw(`(${baseQuery}) as t`))
      .select(qb.raw(outerSelects.join(", ")));

    return finalQuery.toQuery();
  }
}
