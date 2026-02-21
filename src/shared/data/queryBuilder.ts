import knex from "knex";
import type { AggregateReport } from "../../jobs/base";
import { predicateToSql } from "./predicateToSql";

const qb = knex({ client: "pg" }); // Use pg client for SQL generation

export interface QueryOptions {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  accountIds: string[];
  timeGrain?: "daily" | "total";
  limit?: number; // Max rows to return (default 1000 for live queries)
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
    queryBuilder.whereRaw(`account_id IN UNNEST(@accountIds)`);
  }

  // Report Predicate (Split into WHERE and HAVING)
  // We'll do a simple split by ' AND ' for now, but a more robust way would be to parse the AST.
  // Given the project constraints, let's try a slightly smarter split if jsep is available or just use a simple heuristic.
  const predicate = def.predicate as string | undefined;
  const whereParts: string[] = [];
  const havingParts: string[] = [];

  if (predicate) {
    // Simple heuristic: if it contains a metric name from the entity, it's HAVING.
    // Otherwise, it's WHERE.
    const parts = predicate.split(/\s+AND\s+|\s+and\s+/i);
    const entityMetrics = Object.keys(entity.definition.metrics);
    const reportMetrics = Object.keys(def.output.metrics);
    const allMetrics = new Set([...entityMetrics, ...reportMetrics]);

    parts.forEach(part => {
      const containsMetric = Array.from(allMetrics).some(m => part.includes(m));
      if (containsMetric) {
        havingParts.push(predicateToSql(part, metricAliasMap));
      } else {
        whereParts.push(predicateToSql(part)); // No alias mapping for WHERE
      }
    });
  }

  whereParts.forEach(part => {
    if (part) queryBuilder.whereRaw(part);
  });

  // --------------------------------------- 
  // GROUP BY
  // --------------------------------------- 
  queryBuilder.groupBy(groupByFields.map((dim) => qb.raw(String(dim))));

  // --------------------------------------- 
  // HAVING (METRIC FILTERS)
  // --------------------------------------- 
  if (havingParts.length > 0) {
    queryBuilder.havingRaw(havingParts.join(" AND "));
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
    finalQueryBuilder.orderByRaw("date ASC");
  } else if (def.orderBy) {
    finalQueryBuilder.orderByRaw(`${def.orderBy.field} ${def.orderBy.direction ?? "desc"}`);
  }

  // Limit (default 1000 for live queries to prevent browser crashes)
  const limit = options.limit ?? 1000;
  finalQueryBuilder.limit(limit);

  return finalQueryBuilder.toQuery();
}
