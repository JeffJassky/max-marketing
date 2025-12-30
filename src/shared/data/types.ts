import { z } from "zod";

// ─── ENTITY SCHEMAS ──────────────────────────────────────────────────────────

export const EntityPipelineSourceSchema = z.object({
  id: z.string(),
  dataset: z.string(),
  table: z.string(),
  optional: z.boolean().optional(),
});

export const EntityPipelineTransformSchema = z.object({
  mode: z.literal("sql"),
  sql: z.string().min(1),
});

export const EntityPipelineStorageSchema = z.object({
  dataset: z.string(),
  table: z.string(),
  materialized: z.boolean(),
  partitionBy: z.string().optional(),
  clusterBy: z.array(z.string()).optional(),
});

export const EntityPipelineSchema = z.object({
  sources: z.array(EntityPipelineSourceSchema),
  transform: EntityPipelineTransformSchema,
  storage: EntityPipelineStorageSchema,
  schedule: z
    .object({
      mode: z.string(),
      cron: z.string().optional(),
      dependsOnBronze: z.array(z.string()).optional(),
      freshnessSLA: z.string().optional(),
    })
    .optional(),
});

export const EntityMetricSchema = z.object({
  type: z.enum(["number", "string", "date"]),
  optional: z.boolean().optional(),
});

export const EntityDimensionSchema = z.object({
  type: z.enum(["number", "string", "date"]),
  optional: z.boolean().optional(),
});

export const EntitySchema = z.object({
  id: z.string(),
  description: z.string(),
  pipeline: EntityPipelineSchema,
  grain: z.array(z.string()),
  metrics: z.record(z.string(), EntityMetricSchema),
  dimensions: z.record(z.string(), EntityDimensionSchema),
  defaults: z
    .object({
      windowDays: z.number(),
      filters: z
        .array(
          z.object({
            field: z.string(),
            op: z.string(),
            value: z.any(),
          })
        )
        .optional(),
    })
    .optional(),
  capabilities: z
    .object({
      supportsCustomDateRange: z.boolean(),
      supportsAccountFiltering: z.boolean(),
      minWindowDays: z.number(),
    })
    .optional(),
});

export type Entity = z.infer<typeof EntitySchema>;

// ─── SIGNAL SCHEMAS ──────────────────────────────────────────────────────────

export const AggregateReportTargetSchema = z.object({
  entity: z.string(),
  scope: z.string(),
});

export const AggregateReportPredicateSchema = z.object({
  mode: z.literal("expression"),
  expression: z.string().min(1),
});

export const AggregateReportOutputSchema = z.object({
  grain: z.array(z.string()),
  impact: z.object({
    formula: z.string(),
    unit: z.string(),
    direction: z.string(),
  }),
  confidence: z.object({
    mode: z.string(),
    value: z.number(),
  }),
});

export const AggregateReportSnapshotMetricSchema = z.object({
  field: z.string(),
  aggregate: z.enum(["sum", "count", "avg", "min", "max"]),
});

export const AggregateReportSnapshotSchema = z.object({
  enabled: z.boolean(),
  cadence: z.string(),
  windowId: z.string(),
  attributionKey: z.array(z.string()),
  metrics: z.record(z.string(), AggregateReportSnapshotMetricSchema),
  trackDelta: z.boolean(),
});

export const AggregateReportPresentationSchema = z.object({
  titleTemplate: z.string(),
  summaryTemplate: z.string(),
  tags: z.array(z.string()),
  llmExplainPrompt: z.string().optional(),
  suggestedUserPrompts: z.array(z.string()).optional(),
});

export const AggregateReportSchema = z.object({
  id: z.string(),
  kind: z.string(),
  aggregateReportType: z.enum([
    "deterministic",
    "statistical",
    "heuristic",
    "exploratory",
  ]),
  targets: z.array(AggregateReportTargetSchema),
  applicability: z.object({
    minWindowDays: z.number(),
    supportsCustomDateRange: z.boolean(),
    supportsFilteredAccounts: z.boolean(),
    requiresFullAccountContext: z.boolean(),
    supportedModes: z.array(z.string()),
  }),
  predicate: AggregateReportPredicateSchema,
  output: AggregateReportOutputSchema,
  snapshot: AggregateReportSnapshotSchema.optional(),
  presentation: AggregateReportPresentationSchema,
});

export type AggregateReport = z.infer<typeof AggregateReportSchema>;

// ─── MEASURE SCHEMAS ─────────────────────────────────────────────────────────

export const MeasureFilterSchema = z.object({
  field: z.string(),
  op: z.enum(["=", "!=", ">", "<", ">=", "<=", "in", "not in", "contains"]),
  value: z.any(),
});

export const MeasureSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  value: z.union([
    z.object({
      field: z.string(),
      aggregation: z.enum([
        "sum",
        "count",
        "avg",
        "min",
        "max",
        "count_distinct",
      ]),
    }),
    z.object({
      expression: z.string(),
    }),
  ]),
  allowedDimensions: z.array(z.string()).optional(),
  filters: z.array(MeasureFilterSchema).optional(),
});

export type Measure = z.infer<typeof MeasureSchema>;

// ─── MONITOR SCHEMAS ─────────────────────────────────────────────────────────

export const MonitorScanConfigSchema = z.object({
  dimensions: z.array(z.string()),
  minVolume: z.number().default(0),
});

// Strategy 1: Deterministic / Absolute
export const MonitorStrategyThresholdSchema = z.object({
  type: z.literal("threshold"),
  min: z.number().optional(),
  max: z.number().optional(),
});

// Strategy 2: Relative Change
export const MonitorStrategyRelativeDeltaSchema = z.object({
  type: z.literal("relative_delta"),
  comparison: z.enum(["previous_period", "year_over_year"]),
  maxDeltaPct: z.number(),
});

// Strategy 3: Statistical Deviation (Z-Score)
export const MonitorStrategyZScoreSchema = z.object({
  type: z.literal("z_score"),
  threshold: z.number().default(3),
  minDataPoints: z.number().default(14),
});

// Strategy 4: Rare Events (Poisson) - Placeholder for schema
export const MonitorStrategyPoissonSchema = z.object({
  type: z.literal("poisson"),
  confidence: z.number().default(0.99),
});

// Strategy 5: Seasonality - Placeholder for schema
export const MonitorStrategySeasonalSchema = z.object({
  type: z.literal("seasonal_trend"),
  seasonalityPeriod: z.number().default(7),
});

export const MonitorStrategySchema = z.discriminatedUnion("type", [
  MonitorStrategyThresholdSchema,
  MonitorStrategyRelativeDeltaSchema,
  MonitorStrategyZScoreSchema,
  MonitorStrategyPoissonSchema,
  MonitorStrategySeasonalSchema,
]);

export const MonitorClassificationSchema = z.enum([
  "known_problem",
  "heuristic",
  "statistical",
]);

export const MonitorImpactConfigSchema = z.object({
  type: z.enum(["financial", "performance", "operational"]),
  unit: z.string().optional(),
  multiplier: z.number().default(1),
});

export const MonitorSchema = z.object({
  id: z.string(),
  measureId: z.string(),
  enabled: z.boolean().default(true),
  schedule: z.string(), // cron expression
  lookbackDays: z.number(),
  scanConfig: MonitorScanConfigSchema,
  strategy: MonitorStrategySchema,
  classification: MonitorClassificationSchema.default("heuristic"),
  impact: MonitorImpactConfigSchema.optional(),
  contextMetrics: z.array(z.string()).optional(),
});

export type MonitorDef = z.infer<typeof MonitorSchema>;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export const defineEntity = (entity: Entity) => EntitySchema.parse(entity);
export const defineAggregateReport = (aggregateReport: AggregateReport) =>
  AggregateReportSchema.parse(aggregateReport);
