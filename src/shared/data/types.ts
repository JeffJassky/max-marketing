import { z } from 'zod'

// ─── ENTITY SCHEMAS ──────────────────────────────────────────────────────────

export const EntityPipelineSourceSchema = z.object({
	id: z.string(),
	dataset: z.string(),
	table: z.string(),
	optional: z.boolean().optional()
})

export const EntityPipelineTransformSchema = z.object({
	mode: z.literal('sql'),
	sql: z.string().min(1)
})

export const EntityPipelineStorageSchema = z.object({
	dataset: z.string(),
	table: z.string(),
	materialized: z.boolean(),
	partitionBy: z.string().optional(),
	clusterBy: z.array(z.string()).optional()
})

export const EntityPipelineSchema = z.object({
	sources: z.array(EntityPipelineSourceSchema),
	transform: EntityPipelineTransformSchema,
	storage: EntityPipelineStorageSchema,
	schedule: z
		.object({
			mode: z.string(),
			cron: z.string().optional(),
			dependsOnBronze: z.array(z.string()).optional(),
			freshnessSLA: z.string().optional()
		})
		.optional()
})

export const EntityMetricSchema = z.object({
	type: z.enum(['number', 'string', 'date']),
	optional: z.boolean().optional()
})

export const EntityDimensionSchema = z.object({
	type: z.enum(['number', 'string', 'date']),
	optional: z.boolean().optional()
})

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
						value: z.any()
					})
				)
				.optional()
		})
		.optional(),
	capabilities: z
		.object({
			supportsCustomDateRange: z.boolean(),
			supportsAccountFiltering: z.boolean(),
			minWindowDays: z.number()
		})
		.optional()
})

export type Entity = z.infer<typeof EntitySchema>

// ─── SIGNAL SCHEMAS ──────────────────────────────────────────────────────────

export const SignalTargetSchema = z.object({
	entity: z.string(),
	scope: z.string()
})

export const SignalPredicateSchema = z.object({
	mode: z.literal('expression'),
	expression: z.string().min(1)
})

export const SignalOutputSchema = z.object({
	keyFields: z.array(z.string()),
	impact: z.object({
		formula: z.string(),
		unit: z.string(),
		direction: z.string()
	}),
	confidence: z.object({
		mode: z.string(),
		value: z.number()
	})
})

export const SignalSnapshotMetricSchema = z.object({
	field: z.string(),
	aggregate: z.enum(['sum', 'count', 'avg', 'min', 'max'])
})

export const SignalSnapshotSchema = z.object({
	enabled: z.boolean(),
	cadence: z.string(),
	windowId: z.string(),
	attributionKey: z.array(z.string()),
	metrics: z.record(z.string(), SignalSnapshotMetricSchema),
	trackDelta: z.boolean()
})

export const SignalPresentationSchema = z.object({
	titleTemplate: z.string(),
	summaryTemplate: z.string(),
	tags: z.array(z.string()),
	llmExplainPrompt: z.string().optional(),
	suggestedUserPrompts: z.array(z.string()).optional()
})

export const SignalSchema = z.object({
	id: z.string(),
	kind: z.string(),
	signalType: z.enum(['deterministic', 'statistical', 'heuristic', 'exploratory']),
	targets: z.array(SignalTargetSchema),
	applicability: z.object({
		minWindowDays: z.number(),
		supportsCustomDateRange: z.boolean(),
		supportsFilteredAccounts: z.boolean(),
		requiresFullAccountContext: z.boolean(),
		supportedModes: z.array(z.string())
	}),
	predicate: SignalPredicateSchema,
	output: SignalOutputSchema,
	snapshot: SignalSnapshotSchema.optional(),
	presentation: SignalPresentationSchema
})

export type Signal = z.infer<typeof SignalSchema>

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export const defineEntity = (entity: Entity) => EntitySchema.parse(entity)
export const defineSignal = (signal: Signal) => SignalSchema.parse(signal)
