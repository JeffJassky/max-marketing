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
 * Defines the structure for a Silver Entity, representing clean, enriched data derived from a Bronze Import.
 * Entities normalize data, apply business logic, and define the grain for analysis.
 * @template S - The BronzeImport source class.
 */
export type EntityDef<S extends BronzeImport<any, any>> = {
  /** A unique identifier for the entity (e.g., "keywordDaily"). */
  id: string;

  /** A human-readable description of what this entity represents. */
  description: string;

  /** The Bronze Import source that feeds this entity. */
  source: S;

  /**
   * The fields that define the uniqueness/grain of this entity (e.g., ["date", "keyword_id"]).
   * Equivalent to a primary key or composite key.
   */
  grain: (keyof z.infer<S["schema"]>)[];

  /**
   * Definitions for the dimensions (attributes) of the entity.
   * Can map directly to source fields or use SQL expressions.
   */
  dimensions: {
    [key: string]: {
      /** The Zod type for the dimension. */
      type: z.ZodType;

      /** The field name in the source schema to map from. */
      sourceField?: keyof z.infer<S["schema"]>;

      /** Optional SQL expression to derive this dimension (e.g., CASE statements). */
      expression?: string;
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
      sourceField: keyof z.infer<S["schema"]>;
    };
  };

  /** The field by which the table is partitioned (e.g., "date"). */
  partitionBy?: string;

  /** Optional list of fields to cluster the table by for performance optimization. */
  clusterBy?: string[];
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
    const sourceTable = this.definition.source.fqn;

    const grainAndDimensionSelects: (string | import("knex").Knex.Raw)[] = [];

    // Add grain to selects
    this.definition.grain.forEach((field) => {
      const isDim =
        this.definition.dimensions[field as string] ||
        Object.values(this.definition.dimensions).find(
          (d) => d.sourceField === field
        );
      const isMet = Object.values(this.definition.metrics).find(
        (m) => m.sourceField === field
      );
      if (!isDim && !isMet) {
        grainAndDimensionSelects.push(field as string);
      }
    });

    Object.entries(this.definition.dimensions).forEach(([alias, conf]) => {
      if (conf.expression) {
        grainAndDimensionSelects.push(qb.raw(`${conf.expression} AS ${alias}`));
      } else if (conf.sourceField) {
        if (alias === conf.sourceField) {
          grainAndDimensionSelects.push(alias);
        } else {
          grainAndDimensionSelects.push(
            `${String(conf.sourceField)} AS ${alias}`
          );
        }
      }
    });

    const metricSelects = Object.entries(this.definition.metrics).map(
      ([alias, conf]) => {
        return qb.raw(
          `${conf.aggregation.toUpperCase()}(${String(
            conf.sourceField
          )}) AS ${alias}`
        );
      }
    );

    const query = qb
      .select(...grainAndDimensionSelects, ...metricSelects)
      .from(sourceTable)
      .groupBy(...this.definition.grain.map(String))
      .toQuery();

    return query;
  }
}

// ~~~~~~~~~~~~~~~~~
// Gold Signal
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

export type SignalWindowConfig<T extends Entity<BronzeImport<any, any>>> = {
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

export type SignalMetricConfig<T extends Entity<BronzeImport<any, any>>> = {
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
   * Optional expression for derived metrics at the signal layer.
   * If present, the executor treats this as a SQL expression built
   * from other grouped/aggregated fields
   * (e.g. "spend / NULLIF(clicks, 0)").
   */
  expression?: string;
};

export type SignalDerivedFieldConfig = {
  /** SQL expression computed from grouped/aggregated fields. */
  expression: string;

  /** Logical type of the value for downstream typing/validation. */
  type: "number" | "string" | "date" | "boolean";
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Snapshot / output configuration
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export type SignalOutputConfig<T extends Entity<BronzeImport<any, any>>> = {
  /**
   * Fields that uniquely identify a signal record and are used for
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
   * Metrics to materialize into the signal table.
   * Keys are the *output* field names; values describe how to build them.
   *
   * Examples for wastedSpendKeyword:
   * - impressions, clicks, spend, conversions, conversions_value
   * - last_seen as MAX(date)
   */
  metrics: Record<string, SignalMetricConfig<T>>;

  /**
   * Additional derived fields that are not directly aggregated metrics,
   * e.g.:
   * - impact (a function of spend, conversions, etc.)
   * - goal (target or threshold)
   * - strategy_family ("conversion" vs "click")
   */
  derivedFields?: Record<string, SignalDerivedFieldConfig>;
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Full SignalDef
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Defines the structure for a Gold Signal, representing actionable insights derived from Silver Entities.
 * Signals monitor data for specific conditions (predicates) and surface important events or anomalies.
 * @template T - The Entity source class.
 */
export type SignalDef<T extends Entity<BronzeImport<any, any>>> = {
  /** Stable identifier for the signal (e.g. "wastedSpendKeyword"). */
  id: string;

  /** Human-readable description of what this signal detects. */
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
   * (like last_90d) or treat the signal as non-windowed.
   */
  window?: SignalWindowConfig<T>;

  /**
   * Dimensions on the source entity that define the attribution/grouping grain
   * for this signal's snapshot (e.g. account_id, campaign_id, keyword_info_text,
   * bidding_strategy_type for wastedSpendKeyword).
   *
   * The executor groups by these before computing metrics and applying `predicate`.
   */
  // groupBy: EntityDimensionKey<T>[]; // Removed in favor of output.grain

  /**
   * Describes how to build the materialized signal rows: key fields,
   * aggregated metrics, derived fields, and impact/goal/confidence.
   */
  output: SignalOutputConfig<T>;

  /**
   * Optional default sorting for the signal results.
   */
  orderBy?: { field: string; direction: "asc" | "desc" };

  /**
   * Optional: feature flags / tags for orchestration, ownership, etc.
   */
  tags?: string[];
  /** Optional: Whether this signal is currently enabled. */
  enabled?: boolean;
};

/**
 * Represents a Gold-grade data signal, detecting specific business-relevant events or patterns.
 * It queries an underlying Entity, applies aggregations and predicates, and outputs actionable alerts.
 * @template T - The Entity source class.
 */
export class Signal<T extends Entity<BronzeImport<any, any>>> extends BaseData {
  readonly grade = "gold";
  readonly dataset = "signals";
  readonly definition: SignalDef<T>;

  /**
   * Creates an instance of Signal.
   * @param definition - The definition object for the Signal.
   */
  constructor(definition: SignalDef<T>) {
    super(definition.id, definition.description);
    this.definition = definition;
  }

  get schema() {
    // A signal's schema is often the same as its source entity, plus some metadata
    return this.definition.source.schema.extend({
      signal_id: z.string(),
      detected_at: z.string().datetime(),
      impact: z.number().optional(), // Impact might not always be present
    });
  }

  getSignalQuery(options: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
  }): string {
    const def = this.definition;
    const entity = def.source;
    const table = entity.fqn;
    const groupByFields = def.output.grain.map(String);
    const dateField = String(def.window?.dateDimension ?? "date");

    // Use a fresh knex instance tuned for SQL generation (aligns with SignalExecutor)
    const signalQB = knex({ client: "pg" });

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
    Object.entries(def.output.metrics).forEach(([alias, metric]) => {
      if (metric.expression) {
        baseSelects.push(`${metric.expression} AS ${alias}`);
      } else if (metric.sourceMetric) {
        const entityMetric = entity.definition.metrics[metric.sourceMetric as keyof typeof entity.definition.metrics];
        const agg = metric.aggregation ?? entityMetric.aggregation;
        baseSelects.push(
          `${agg.toUpperCase()}(${String(
            entityMetric.sourceField
          )}) AS ${alias}`
        );
      }
      metricAliasMap[alias] = alias;
    });

    const baseQueryBuilder = signalQB
      .from(signalQB.raw(`\`${table}\``))
      .select(signalQB.raw(baseSelects.join(", ")));

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

    baseQueryBuilder.groupBy(groupByFields.map((dim) => signalQB.raw(dim)));

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
    outerSelects.push(`'${def.id}' AS signal_id`);
    outerSelects.push(`CURRENT_TIMESTAMP() AS detected_at`);

    const finalQuery = signalQB
      .from(signalQB.raw(`(${baseQuery}) as t`))
      .select(signalQB.raw(outerSelects.join(", ")));

    if (def.orderBy) {
      finalQuery.orderByRaw(`${def.orderBy.field} ${def.orderBy.direction}`);
    }

    return finalQuery.toQuery();
  }
}
