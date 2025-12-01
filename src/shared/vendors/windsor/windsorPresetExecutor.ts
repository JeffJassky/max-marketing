import type { TableField } from '@google-cloud/bigquery'

import { type WindsorImportKey, windsorImportQueries } from '../../../jobs/imports'

import { WindsorRequestParams } from './windsor.d'
import { windsor } from './windsor'
import { type BigQueryRow, upsertPartitionedClusteredTable } from '../google/bigquery/bigquery'

type WindsorImportDefinition = (typeof windsorImportQueries)[WindsorImportKey]

export type WindsorSchemaRegistry = Record<string, TableField[]>

export interface WindsorImportExecutorOptions {
	projectId: string
	schemaRegistry?: WindsorSchemaRegistry
}

export interface WindsorImportRunOptions {
	requestOverrides?: WindsorRequestParams
	schemaOverride?: TableField[]
}

export interface WindsorImportExecutionResult<E extends WindsorImportKey = WindsorImportKey> {
	preset: (typeof windsorImportQueries)[E]
	rowCount: number
	meta: WindsorImportRunMeta
}

export interface WindsorImportRunMeta {
	requestedAt: Date
}

/**
 * Orchestrates executing a Windsor preset and persisting the response into BigQuery.
 * Keeps the state minimal so callers can supply their own schema registry or overrides.
 */
export class WindsorImportExecutor {
	private readonly schemaRegistry: WindsorSchemaRegistry = {}

	constructor() {}

	async run<E extends WindsorImportKey>(
		presetKey: E,
		options: WindsorImportRunOptions = {}
	): Promise<WindsorImportExecutionResult<E>> {
		const preset = this.resolvePreset(presetKey)
		const requestedAt = new Date()
		const request = this.buildRequest(preset, options.requestOverrides)
		const response = await windsor.request(request)
		const rows = response.data ?? []

		if (!rows.length) {
			return { preset, rowCount: 0, meta: { requestedAt } }
		}

		const schema = options.schemaOverride ?? this.lookupSchema(preset)

		await upsertPartitionedClusteredTable(rows as BigQueryRow[], {
			datasetId: preset.destination.dataset,
			tableId: preset.destination.table,
			partitionField: this.resolvePartitionField(preset),
			clusteringFields: preset.destination.cluster_by,
			schema
		})

		return {
			preset,
			rowCount: rows.length,
			meta: { requestedAt }
		}
	}

	private resolvePreset<E extends WindsorImportKey>(
		presetKey: E
	): (typeof windsorImportQueries)[E] {
		const preset = windsorImportQueries[presetKey]
		if (!preset) {
			throw new Error(`Preset "${presetKey}" is not defined.`)
		}
		return preset
	}

	private buildRequest<E extends WindsorImportKey>(
		preset: (typeof windsorImportQueries)[E],
		overrides?: WindsorRequestParams
	) {
		return {
			...preset.request,
			params: {
				...(preset.request.params ?? {}),
				...(overrides ?? {})
			}
		} as typeof preset.request
	}

	private lookupSchema(preset: WindsorImportDefinition): TableField[] | undefined {
		const registryKey = this.buildSchemaRegistryKey(preset)
		return this.schemaRegistry[registryKey]
	}

	private buildSchemaRegistryKey(preset: WindsorImportDefinition): string {
		const { table } = preset.destination
		return `${table}_v${preset.destination.schema_version}`
	}

	private resolvePartitionField(preset: WindsorImportDefinition): string {
		const partitionField = preset.destination.partition_by
		if (!partitionField) {
			throw new Error(
				`Preset "${preset.id}" is missing destination.partition_by which is required for BigQuery partitioning.`
			)
		}
		return partitionField
	}
}
