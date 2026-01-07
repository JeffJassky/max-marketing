import { z } from "zod";
import {
  WindsorEndpoint,
  WindsorRequestParams,
  WindsorRequest,
  EndpointDimensions,
  EndpointMetrics,
} from "../shared/vendors/windsor/windsor.d";
import snakeCase from "lodash/snakeCase";
import knex from "knex";
import { predicateToSql } from "../shared/data/predicateToSql";
import { createBigQueryClient } from "../shared/vendors/google/bigquery/bigquery"; // Added import

const qb = knex({ client: "mysql" });

// ~~~~~~~~~~~~~~~~~
// Base
// ~~~~~~~~~~~~~~~~~

export abstract class BaseData {
  readonly id: string;
  readonly description: string;
  abstract readonly grade: "bronze" | "silver" | "gold";
  abstract readonly dataset: string;

  constructor(id: string, description: string) {
    this.id = id;
    this.description = description;
  }

  get tableName(): string {
    return snakeCase(this.id);
  }

  get fqn(): string {
    return `${this.dataset}.${this.tableName}`;
  }

  abstract get schema(): z.ZodObject<any>;
}

// ~~~~~~~~~~~~~~~~~
// Bronze Import
// ~~~~~~~~~~~~~~~~~
/**
 * Defines the structure for a Bronze Import, representing raw data imported from an external source.
 * This data is typically directly from an API or external service, with minimal transformations.
 * @template DimensionsShape - The Zod shape for the dimensions of the import.
 * @template MetricsShape - The Zod shape for the metrics of the import.
 */
export type BronzeImportDef<
  DimensionsShape extends z.ZodRawShape = z.ZodRawShape,
  MetricsShape extends z.ZodRawShape = z.ZodRawShape
> = {
  /** A unique identifier for the import (e.g., "coreKeywordPerformance"). */
  id: string;
  /** A human-readable description of the import's purpose and content. */
  description: string;
  /** The platform the data is imported from (e.g., "google_ads", "facebook_ads"). */
  platform: string;
  /** The specific endpoint or data source within the platform (e.g., "googleAdsKeywordPerformance"). */
  endpoint: string;
  /** The Zod schema defining the metrics available in this import. */
  metrics: MetricsShape;
  /** The Zod schema defining the dimensions available in this import. */
  dimensions: DimensionsShape;
  /** The version of the import definition, used for schema evolution. */
  version: number;
  /** The field by which the data is partitioned (e.g., "date"). */
  partitionBy: string;
  /** Optional: A list of fields to cluster the data by, improving query performance for common filter patterns. */
  clusterBy?: string[];
  /** Optional: Default parameters to send with the Windsor API request. */
  params?: WindsorRequestParams;
};

/**
 * Represents a Bronze-grade data import, typically raw data directly from an external API.
 * It extends BaseData and includes definitions for dimensions, metrics, and API request parameters.
 * @template DimensionsShape - The Zod shape for the dimensions of the import.
 * @template MetricsShape - The Zod shape for the metrics of the import.
 */
export class BronzeImport<
  DimensionsShape extends z.ZodRawShape,
  MetricsShape extends z.ZodRawShape
> extends BaseData {
  readonly grade = "bronze";
  readonly dataset = "imports";
  readonly definition: BronzeImportDef<DimensionsShape, MetricsShape>;

  /**
   * Creates an instance of BronzeImport.
   * @param definition - The definition object for the Bronze Import.
   */
  constructor(definition: BronzeImportDef<DimensionsShape, MetricsShape>) {
    super(definition.id, definition.description);
    this.definition = definition;
  }

  get schema(): z.ZodObject<DimensionsShape & MetricsShape> {
    return z.object({
      ...this.definition.dimensions,
      ...this.definition.metrics,
    }) as z.ZodObject<DimensionsShape & MetricsShape>;
  }

  getRequest(paramOverrides: WindsorRequestParams = {}): WindsorRequest {
    const { endpoint, dimensions, metrics, params, platform } = this.definition;
    return {
      endpoint,
      connector: platform as any, //TODO: fix this any
      dimensions: Object.keys(dimensions),
      metrics: Object.keys(metrics),
      params: {
        ...params,
        ...paramOverrides,
      },
    };
  }
}

// ~~~~~~~~~~~~~~~~~
// Silver Entity
// ~~~~~~~~~~~~~~~~~
type MetricAggregation = "sum" | "avg" | "count" | "min" | "max";

/**
 * Defines the structure for a Silver Entity, representing clean, enriched data derived from one or more Bronze Imports.
 * Entities normalize data, apply business logic, and define the grain for analysis.
 * @template S - The BronzeImport source class.
 */
export type EntityDef<S extends BronzeImport<any, any>> = {
  /** A unique identifier for the entity (e.g., "keywordDaily"). */
  id: string;

  /** A human-readable label for the entity (e.g., "Keyword Performance"). */
  label?: string;

  /** A human-readable description of what this entity represents. */
  description: string;

  /** The Bronze Import source(s) that feed this entity. */
  sources: BronzeImport<any, any>[];

  /**
   * The fields that define the uniqueness/grain of this entity (e.g., ["date", "keyword_id"]).
   * Equivalent to a primary key or composite key.
   */
  grain: string[];

  /**
   * Definitions for the dimensions (attributes) of the entity.
   * Can map directly to source fields or use SQL expressions.
   */
  dimensions: {
    [key: string]: {
      /** The Zod type for the dimension. */
      type: z.ZodType;

      /** The field name in the source schema to map from. */
      sourceField?: string;

      /** Optional SQL expression to derive this dimension (e.g., CASE statements). */
      expression?: string;

      /** Optional overrides for specific sources. */
      sources?: Record<string, { sourceField?: string; expression?: string }>;
    };
  };

  /**
   * Definitions for the metrics (quantitative measures) of the entity.
   * Always involves an aggregation function.
   */
  metrics: {
    [key: string]: {
      /** The Zod type for the metric. */
      type: z.ZodType;

      /** The aggregation function to apply (sum, avg, count, min, max). */
      aggregation: MetricAggregation;

      /** The field name in the source schema to aggregate. */
      sourceField?: string;

      /** Optional SQL expression for the metric (overrides sourceField). */
      expression?: string;

      /** Optional overrides for specific sources. */
      sources?: Record<string, { sourceField?: string; expression?: string }>;
    };
  };

  /** The field by which the table is partitioned (e.g., "date"). */
  partitionBy?: string;

  /** Optional list of fields to cluster the table by for performance optimization. */
  clusterBy?: string[];

  /** Optional configuration for generating superlative insights (e.g., Top Campaign by Spend). */
  superlatives?: {
    /** The SQL column that serves as the unique key (e.g., 'campaign_id' or 'age'). Used for history tracking. */
    dimensionId: string;
    /** The SQL column that provides the display name (e.g., 'campaign_name'). If omitted, dimensionId is used. */
    dimensionNameField?: string;
    /** The human-readable label for the UI (e.g., 'Campaign' or 'Age'). Used in chart titles. */
    dimensionLabel: string;
    limit?: number; // Optional limit (default 3)
    metrics: {
      metric: string;
      expression?: string;
      rank_type?: "highest" | "lowest";
      awards?: any[]; // Optional array of AwardDefinition
    }[];
  }[];
};

/**
 * Represents a Silver-grade data entity, providing a cleaned and modeled view of the raw data.
 * It handles the transformation logic from Bronze imports to useful analytical tables.
 * @template S - The BronzeImport source class.
 */
export class Entity<S extends BronzeImport<any, any>> extends BaseData {
  readonly grade = "silver";
  readonly dataset = "entities";
  readonly definition: EntityDef<S>;

  /**
   * Creates an instance of Entity.
   * @param definition - The definition object for the Entity.
   */
  constructor(definition: EntityDef<S>) {
    super(definition.id, definition.description);
    this.definition = definition;
  }

  get schema() {
    const dims = Object.fromEntries(
      Object.entries(this.definition.dimensions).map(([k, v]) => [k, v.type])
    );
    const mets = Object.fromEntries(
      Object.entries(this.definition.metrics).map(([k, v]) => [k, v.type])
    );
    return z.object({ ...dims, ...mets });
  }

  getTransformQuery(): string {
    const buildSourceQuery = (source: BronzeImport<any, any>) => {
      const sourceTable = source.fqn;
      const sourceId = source.id;

      const grainAndDimensionSelects: (string | import("knex").Knex.Raw)[] = [];

      // Add grain to selects
      this.definition.grain.forEach((field) => {
        const isDim =
          this.definition.dimensions[field] ||
          Object.values(this.definition.dimensions).find(
            (d) => (d.sources?.[sourceId]?.sourceField || d.sourceField) === field
          );
        const isMet = Object.values(this.definition.metrics).find(
          (m) => (m.sources?.[sourceId]?.sourceField || m.sourceField) === field
        );
        if (!isDim && !isMet) {
          grainAndDimensionSelects.push(field);
        }
      });

      Object.entries(this.definition.dimensions).forEach(([alias, conf]) => {
        const override = conf.sources?.[sourceId];
        const expression = override?.expression || conf.expression;
        const sourceField = override?.sourceField || conf.sourceField || alias;
        const isPartOfGrain = this.definition.grain.includes(alias);

        let selectExpression = "";
        if (expression) {
          selectExpression = `${expression} AS ${alias}`;
        } else {
          selectExpression =
            alias === sourceField
              ? alias
              : `${String(sourceField)} AS ${alias}`;
        }

        if (!isPartOfGrain) {
          grainAndDimensionSelects.push(
            qb.raw(`ANY_VALUE(${selectExpression.replace(` AS ${alias}`, "")}) AS ${alias}`)
          );
        } else {
          grainAndDimensionSelects.push(qb.raw(selectExpression));
        }
      });

      const metricSelects = Object.entries(this.definition.metrics).map(
        ([alias, conf]) => {
          const override = conf.sources?.[sourceId];
          const expression = override?.expression || conf.expression;
          const sourceField = override?.sourceField || conf.sourceField || alias;

          if (expression) {
            return qb.raw(`COALESCE(${expression}, 0) AS ${alias}`);
          }

          // Automatically cast to FLOAT64 for numeric aggregations to handle string-typed raw data
          // and wrap in COALESCE to ensure a default of 0 instead of NULL
          return qb.raw(
            `COALESCE(${conf.aggregation.toUpperCase()}(SAFE_CAST(${String(
              sourceField
            )} AS FLOAT64)), 0) AS ${alias}`
          );
        }
      );

      return qb
        .select(...grainAndDimensionSelects, ...metricSelects)
        .from(qb.raw(`\`${sourceTable}\``))
        .groupBy(...this.definition.grain.map(String))
        .toQuery();
    };

    if (this.definition.sources.length === 1) {
      return buildSourceQuery(this.definition.sources[0]);
    }

    return this.definition.sources
      .map((s) => `(${buildSourceQuery(s)})`)
      .join("\nUNION ALL\n");
  }
}

// ~~~~~~~~~~~~~~~~~
// Gold AggregateReport
// ~~~~~~~~~~~~~~~~~

// Helpers to refer to the entity definition keys in a type-safe way
type EntityDimensions<T extends Entity<BronzeImport<any, any>>> =
  T["definition"]["dimensions"];
type EntityMetrics<T extends Entity<BronzeImport<any, any>>> =
  T["definition"]["metrics"];

type EntityDimensionKey<T extends Entity<BronzeImport<any, any>>> =
  keyof EntityDimensions<T>;
type EntityMetricKey<T extends Entity<BronzeImport<any, any>>> =
  keyof EntityMetrics<T>;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Window configuration
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export type AggregateReportWindowConfig<
  T extends Entity<BronzeImport<any, any>>
> = {
  /** Identifier for the window preset, e.g. "last_90d". */
  id: string;

  /** Number of days to look back from "now" / run date. */
  lookbackDays: number;

  /**
   * Which date-like dimension on the entity defines the time axis
   * (e.g. "date" for keywordDaily).
   */
  dateDimension: EntityDimensionKey<T>;
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Metric & derived field config
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export type AggregateReportMetricConfig<
  T extends Entity<BronzeImport<any, any>>
> = {
  /**
   * Name of the metric on the source Entity to aggregate from.
   * If provided, the executor uses that metric's default aggregation
   * from EntityDef.metrics unless overridden by `aggregation`.
   */
  sourceMetric?: EntityMetricKey<T>;

  /**
   * Optional override for aggregation behavior.
   * If omitted, falls back to the aggregation on the source metric
   * (e.g. sum for spend/clicks/impressions).
   */
  aggregation?: "sum" | "avg" | "count" | "min" | "max";

  /**
   * Optional expression for derived metrics at the aggregateReport layer.
   * If present, the executor treats this as a SQL expression built
   * from other grouped/aggregated fields
   * (e.g. "spend / NULLIF(clicks, 0)").
   */
  expression?: string;

  /**
   * Optional Zod type for the metric.
   * If omitted, inferred from source metric or defaults to number.
   */
  type?: z.ZodType;
};

export type AggregateReportDerivedFieldConfig = {
  /** SQL expression computed from grouped/aggregated fields. */
  expression: string;

  /** Logical type of the value for downstream typing/validation. */
  type: z.ZodType;
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Snapshot / output configuration
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export type AggregateReportOutputConfig<
  T extends Entity<BronzeImport<any, any>>
> = {
  /**
   * Fields that uniquely identify a aggregateReport record and are used for
   * deduping/attribution. Typically the same as `groupBy`.
   */
  grain: EntityDimensionKey<T>[];

  /**
   * Optional non-key dimensions to include in the snapshot output.
   * Useful for human-readable labels (e.g. campaign name) that are
   * not part of the grouping grain. These are selected via ANY_VALUE().
   */
  includeDimensions?: EntityDimensionKey<T>[];

  /**
   * Metrics to materialize into the aggregateReport table.
   * Keys are the *output* field names; values describe how to build them.
   *
   * Examples for wastedSpendKeyword:
   * - impressions, clicks, spend, conversions, conversions_value
   * - last_seen as MAX(date)
   */
  metrics: Record<string, AggregateReportMetricConfig<T>>;

  /**
   * Additional derived fields that are not directly aggregated metrics,
   * e.g.:
   * - impact (a function of spend, conversions, etc.)
   * - goal (target or threshold)
   * - strategy_family ("conversion" vs "click")
   */
  derivedFields?: Record<string, AggregateReportDerivedFieldConfig>;
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Full AggregateReportDef
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Defines the structure for a Gold AggregateReport, representing actionable insights derived from Silver Entities.
 * AggregateReports monitor data for specific conditions (predicates) and surface important events or anomalies.
 * @template T - The Entity source class.
 */
export type AggregateReportDef<T extends Entity<BronzeImport<any, any>>> = {
  /** Stable identifier for the aggregateReport (e.g. "wastedSpendKeyword"). */
  id: string;

  /** Human-readable description of what this aggregateReport detects. */
  description: string;

  /** Source entity that provides the base grain and metrics. */
  source: T;

  /**
   * Predicate applied to the *aggregated* row in a HAVING clause.
   * All metric/field names referenced here must correspond to names
   * defined in `output.metrics` or `output.derivedFields`.
   *
   * Example (for wastedSpendKeyword):
   * "(spend > 0 AND bidding_strategy_type IN (...) AND conversions = 0)
   *  OR (spend > 0 AND bidding_strategy_type IN (...) AND clicks = 0)"
   */
  predicate: string;

  /**
   * Optional window configuration (e.g. last_90d).
   * If omitted, the executor can fall back to a default window
   * (like last_90d) or treat the aggregateReport as non-windowed.
   */
  window?: AggregateReportWindowConfig<T>;

  /**
   * Dimensions on the source entity that define the attribution/grouping grain
   * for this aggregateReport's snapshot (e.g. account_id, campaign_id, keyword_info_text,
   * bidding_strategy_type for wastedSpendKeyword).
   *
   * The executor groups by these before computing metrics and applying `predicate`.
   */
  // groupBy: EntityDimensionKey<T>[]; // Removed in favor of output.grain

  /**
   * Describes how to build the materialized aggregateReport rows: key fields,
   * aggregated metrics, derived fields, and impact/goal/confidence.
   */
  output: AggregateReportOutputConfig<T>;

  /**
   * Optional default sorting for the aggregateReport results.
   */
  orderBy?: { field: string; direction: "asc" | "desc" };

  /**
   * Optional: feature flags / tags for orchestration, ownership, etc.
   */
  tags?: string[];
  /** Optional: Whether this aggregateReport is currently enabled. */
  enabled?: boolean;
};

// ~~~~~~~~~~~~~~~~~
// AggregateReport Inference Helper
// ~~~~~~~~~~~~~~~~~

type InferAggregateReportRow<
  T extends Entity<BronzeImport<any, any>>,
  Def extends AggregateReportDef<T>
> =
  // Grain (any)
  {
    [K in Def["output"]["grain"][number]]: any;
  } & (Def["output"]["includeDimensions"] extends ReadonlyArray<infer K> // Included Dimensions (any)
    ? { [P in K & string]: any }
    : {}) & {
      // Metrics
      [K in keyof Def["output"]["metrics"]]: Def["output"]["metrics"][K]["type"] extends z.ZodType
        ? z.infer<Def["output"]["metrics"][K]["type"]>
        : number;
    } & (Def["output"]["derivedFields"] extends Record<string, any> // Derived Fields
      ? {
          [K in keyof Def["output"]["derivedFields"]]: z.infer<
            Def["output"]["derivedFields"][K]["type"]
          >;
        }
      : {}) & {
      // Metadata
      report_id: string;
      detected_at: string | { value: string };
    };

/**
 * Represents a Gold-grade data aggregateReport, detecting specific business-relevant events or patterns.
 * It queries an underlying Entity, applies aggregations and predicates, and outputs actionable alerts.
 * @template T - The Entity source class.
 */
export class AggregateReport<
  T extends Entity<BronzeImport<any, any>>,
  const Def extends AggregateReportDef<T> = AggregateReportDef<T>
> extends BaseData {
  readonly grade = "gold";
  readonly dataset = "reports";
  readonly definition: Def;

  /**
   * Creates an instance of AggregateReport.
   * @param definition - The definition object for the AggregateReport.
   */
  constructor(definition: Def) {
    super(definition.id, definition.description);
    this.definition = definition;
  }

  /**
   * Constructs the Zod schema for the aggregateReport's output.
   * This includes grain, included dimensions, metrics, derived fields, and metadata.
   */
  get outputSchema() {
    const def = this.definition;
    const sourceSchema = def.source.schema.shape;
    const shape: Record<string, z.ZodTypeAny> = {}; // Changed type here

    // 1. Grain fields
    def.output.grain.forEach((field) => {
      const fieldName = field as string;
      const sourceType = (sourceSchema as Record<string, z.ZodType>)[fieldName];
      if (sourceType) {
        shape[fieldName] = sourceType;
      } else {
        // Fallback or error? Assuming source schema has it.
        shape[fieldName] = z.any();
      }
    });

    // 2. Included dimensions
    def.output.includeDimensions?.forEach((field) => {
      const fieldName = field as string;
      const sourceType = (sourceSchema as Record<string, z.ZodType>)[fieldName];
      if (sourceType) {
        shape[fieldName] = sourceType;
      }
    });

    // 3. Metrics
    Object.entries(def.output.metrics).forEach(([alias, config]) => {
      if (config.type) {
        shape[alias] = config.type;
      } else if (config.sourceMetric) {
        // Try to find type from source entity definition
        const sourceMetricDef =
          def.source.definition.metrics[config.sourceMetric as string];
        if (sourceMetricDef) {
          shape[alias] = sourceMetricDef.type;
        } else {
          shape[alias] = z.number(); // Default to number for metrics
        }
      } else {
        shape[alias] = z.number();
      }
    });

    // 4. Derived fields
    if (def.output.derivedFields) {
      Object.entries(def.output.derivedFields).forEach(([alias, config]) => {
        shape[alias] = config.type;
      });
    }

    // 5. Metadata
    shape["report_id"] = z.string();
    shape["detected_at"] = z
      .string()
      .datetime()
      .or(z.object({ value: z.string() })); // Handle BQ timestamp format

    return z.object(shape);
  }

  get schema(): z.ZodObject<any> {
    return this.outputSchema;
  }

  getAggregateReportQuery(options: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
  }): string {
    const def = this.definition;
    const entity = def.source;
    const table = entity.fqn;
    const groupByFields = def.output.grain.map(String);
    const dateField = String(def.window?.dateDimension ?? "date");

    // Use a fresh knex instance tuned for SQL generation (aligns with AggregateReportExecutor)
    const aggregateReportQB = knex({ client: "pg" });

    // Resolve window start
    let windowStartSQL: string | undefined;
    if (options.startDate || options.endDate) {
      windowStartSQL = options.startDate ? `'${options.startDate}'` : undefined;
    } else if (def.window) {
      windowStartSQL = `DATE_SUB(CURRENT_DATE(), INTERVAL ${def.window.lookbackDays} DAY)`;
    }

    // Build SELECT list: groupBy + metrics
    const baseSelects: string[] = [];
    groupByFields.forEach((dim) => {
      baseSelects.push(`${dim} AS ${dim}`);
    });

    // Non-key/pass-through dimensions
    def.output.includeDimensions?.forEach((dim) => {
      baseSelects.push(`ANY_VALUE(${String(dim)}) AS ${String(dim)}`);
    });

    const metricAliasMap: Record<string, string> = {};
    console.log(
      `[DEBUG] metrics keys: ${Object.keys(def.output.metrics).join(", ")}`
    );
    Object.entries(def.output.metrics).forEach(([alias, metric]) => {
      if (metric.expression) {
        baseSelects.push(`${metric.expression} AS ${alias}`);
      } else {
        // Determine the column name on the source Entity
        const sourceMetricName = (metric.sourceMetric ?? alias) as string;

        // Look up the metric definition on the Entity to get default aggregation
        const entityMetric =
          entity.definition.metrics[
            sourceMetricName as keyof typeof entity.definition.metrics
          ];

        if (entityMetric) {
          const agg = metric.aggregation ?? entityMetric.aggregation;
          baseSelects.push(
            `${agg.toUpperCase()}(${sourceMetricName}) AS ${alias}`
          );
        } else if (metric.aggregation) {
          // Fallback: if aggregation is explicit but metric not found in entity def (rare), assume column exists
          baseSelects.push(
            `${metric.aggregation.toUpperCase()}(${sourceMetricName}) AS ${alias}`
          );
        }
      }
      metricAliasMap[alias] = alias;
    });

    console.log(`[DEBUG] baseSelects: ${baseSelects.join(" | ")}`);

    const baseQueryBuilder = aggregateReportQB
      .from(aggregateReportQB.raw(`\`${table}\``))
      .select(aggregateReportQB.raw(baseSelects.join(", ")));

    if (windowStartSQL) {
      baseQueryBuilder.whereRaw(`${dateField} >= ${windowStartSQL}`);
    }
    if (options.endDate) {
      baseQueryBuilder.whereRaw(`${dateField} <= '${options.endDate}'`);
    }
    if (options.accountId) {
      // Use raw with bindings to avoid double-quoting identifiers (BigQuery treats "col" as a string literal)
      baseQueryBuilder.whereRaw("account_id = ?", [options.accountId]);
    }

    baseQueryBuilder.groupBy(
      groupByFields.map((dim) => aggregateReportQB.raw(dim))
    );

    const having = predicateToSql(def.predicate, metricAliasMap);
    if (having && having.trim().length > 0) {
      baseQueryBuilder.havingRaw(having);
    }

    const baseQuery = baseQueryBuilder.toQuery();

    // Outer projection to add derived fields + metadata
    const outerSelects: string[] = ["t.*"];
    if (def.output.derivedFields) {
      for (const [alias, cfg] of Object.entries(def.output.derivedFields)) {
        outerSelects.push(`${cfg.expression} AS ${alias}`);
      }
    }
    outerSelects.push(`'${def.id}' AS report_id`);
    outerSelects.push(`CURRENT_TIMESTAMP() AS detected_at`);

    const finalQuery = aggregateReportQB
      .from(aggregateReportQB.raw(`(${baseQuery}) as t`))
      .select(aggregateReportQB.raw(outerSelects.join(", ")));

    if (def.orderBy) {
      finalQuery.orderByRaw(`${def.orderBy.field} ${def.orderBy.direction}`);
    }

    return finalQuery.toQuery();
  }

  /**
   * Fetches the latest materialized snapshot for this report.
   */
  async getData(accountId: string, limit: number = 100) {
    const bqClient = createBigQueryClient();
    const query = `
      SELECT *
      FROM \`${this.dataset}.${this.tableName}\`
      WHERE account_id = @accountId
      ORDER BY detected_at DESC
      LIMIT @limit
    `;

    console.log(`[AggregateReport] Fetching materialized data from ${this.dataset}.${this.tableName} for account: ${accountId}`);

    const [rows] = await bqClient.query({
      query,
      params: { accountId, limit }
    });

    return rows.map(row => ({
        ...row,
        detected_at: typeof row.detected_at === 'object' && row.detected_at?.value 
            ? row.detected_at.value 
            : row.detected_at
    }));
  }

  /**
   * Executes the aggregateReport query (live aggregation) and returns results.
   * @param options - Query options (accountId, date range).
   */
  async getRows(options: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
  }): Promise<InferAggregateReportRow<T, Def>[]> {
    const bqClient = createBigQueryClient(); // Create client internally
    const query = this.getAggregateReportQuery(options);
    const [rows] = await bqClient.query(query);

    console.log(
      `[${this.id}] Returned ${rows.length} row(s) for accountId=${
        options.accountId || "N/A"
      }`
    );

    return rows.map((row: any) => ({
      ...row,
      detected_at:
        typeof row.detected_at === "object" && row.detected_at?.value
          ? row.detected_at.value
          : row.detected_at,
    })) as InferAggregateReportRow<T, Def>[];
  }
}
