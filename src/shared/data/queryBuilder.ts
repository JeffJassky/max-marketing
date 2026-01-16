import knex from "knex";
import type { AggregateReport } from "../../jobs/base";
import { predicateToSql } from "./predicateToSql";

const qb = knex({ client: "pg" }); // Use pg client for SQL generation

export interface QueryOptions {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  accountIds: string[];
  timeGrain?: "daily" | "total";
}

export function buildReportQuery(
  report: AggregateReport<any, any>,
  options: QueryOptions
): string {
  const def = report.definition as any;
  const entity = report.definition.source;
  const table = entity.fqn;
  
  // --------------------------------------- 
  // GRAIN RESOLUTION
  // --------------------------------------- 
  // Start with the report's defined grain
  const groupByFields = [...def.output.grain] as string[];

  // If daily grain is requested, ensure 'date' is included
  // We assume the entity has a 'date' dimension (standard in this project)
  if (options.timeGrain === "daily") {
    if (!groupByFields.includes("date")) {
      groupByFields.unshift("date");
    }
  }

  // --------------------------------------- 
  // SELECT LIST
  // --------------------------------------- 
  const selectList: string[] = [];

  // 1. Group By Fields
  groupByFields.forEach((dim) => {
    selectList.push(`${dim} AS ${dim}`);
  });

  // 2. Metrics
  // We map the metric definitions to SQL aggregations
  const metricAliasMap: Record<string, string> = {}; 
  Object.entries(def.output.metrics as Record<string, any>).forEach(([alias, metric]) => {
    if (metric.expression) {
      // Derived/Expression metric in the base selection (uncommon but possible)
      selectList.push(`${metric.expression} AS ${alias}`);
    } else {
      const sourceMetricName = (metric.sourceMetric ?? alias) as string;
      const entityMetric = entity.definition.metrics[sourceMetricName];

      if (entityMetric) {
        const agg = metric.aggregation ?? entityMetric.aggregation ?? "SUM";
        selectList.push(`${agg.toUpperCase()}(${sourceMetricName}) AS ${alias}`);
      } else {
        // Fallback if not found in entity (e.g. explicitly defined in report)
        const agg = metric.aggregation ?? "SUM";
        selectList.push(`${agg.toUpperCase()}(${sourceMetricName}) AS ${alias}`);
      }
    }
    metricAliasMap[alias] = alias;
  });
  
  // 3. Any Value Dimensions (Non-grouped dimensions)
  // Only include these if we are NOT in daily mode, or if they are truly static.
  // Actually, standard SQL requires non-aggregated fields to be in GROUP BY.
  // AggregateReport definition uses ANY_VALUE for these.
  (def.output.includeDimensions as string[] | undefined)?.forEach((dim) => {
    selectList.push(`ANY_VALUE(${String(dim)}) AS ${String(dim)}`);
  });

  // --------------------------------------- 
  // BASE QUERY BUILDER
  // --------------------------------------- 
  const queryBuilder = qb
    .from(qb.raw(`\`${table}\``))
    .select(qb.raw(selectList.join(", ")));

  // --------------------------------------- 
  // FILTERS (WHERE)
  // --------------------------------------- 
  const dateField = String(def.window?.dateDimension ?? "date");

  // Date Range
  queryBuilder.whereRaw(`${dateField} >= ?`, [options.startDate]);
  queryBuilder.whereRaw(`${dateField} <= ?`, [options.endDate]);

  // Account IDs
  if (options.accountIds.length > 0) {
    // knex whereIn with array binding can be tricky with BigQuery parameter syntax
    // We'll use raw SQL for UNNEST compatibility which is preferred in this project's style
    // BUT buildReportQuery is generating a string to be executed by BQ client.
    // The BQ client supports parameterized queries.
    // However, to keep this builder producing a pure SQL string (or close to it),
    // we might inject values or use placeholders.
    // Let's use the BigQuery UNNEST syntax for array params: account_id IN UNNEST(@accountIds)
    // The caller is responsible for passing the params object.
    queryBuilder.whereRaw(`account_id IN UNNEST(@accountIds)`);
  }

  // --------------------------------------- 
  // GROUP BY
  // --------------------------------------- 
  queryBuilder.groupBy(groupByFields.map((dim) => qb.raw(String(dim))));

  // --------------------------------------- 
  // HAVING (REPORT PREDICATE)
  // --------------------------------------- 
  // Note: We need to check if the predicate uses dimensions (move to WHERE) or metrics (HAVING).
  // Current 'predicateToSql' assumes having. 
  // For now, we stick to the existing logic which puts it in HAVING.
  // Caveat: If predicate filters on dimensions not in group by, it will fail (as seen before).
  // Ideally, report predicates should only filter on metrics or grouped dimensions.
  const having = predicateToSql(def.predicate, metricAliasMap);
  if (having && having.trim().length > 0) {
    queryBuilder.havingRaw(having);
  }

  const baseQuery = queryBuilder.toQuery();

  // --------------------------------------- 
  // OUTER QUERY (DERIVED FIELDS)
  // --------------------------------------- 
  const outerSelects: string[] = ["t.*\n"];

  if (def.output.derivedFields) {
    for (const [alias, cfg] of Object.entries(def.output.derivedFields as Record<string, any>)) {
      outerSelects.push(`${cfg.expression} AS ${alias}`);
    }
  }

  const finalQueryBuilder = qb
    .from(qb.raw(`(${baseQuery}) as t`))
    .select(qb.raw(outerSelects.join(", ")));

  // Order By
  if (options.timeGrain === "daily") {
    finalQueryBuilder.orderBy("date", "asc");
  } else if (def.orderBy) {
    finalQueryBuilder.orderBy(String(def.orderBy.field), def.orderBy.direction ?? "desc");
  }

  return finalQueryBuilder.toQuery();
}
