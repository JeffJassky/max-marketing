import {
	BigQuery,
	type BigQueryOptions,
	type Table,
	type TableField
} from '@google-cloud/bigquery'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { GoogleAuthOptions, JWTInput } from 'google-auth-library'

export type BigQueryRow = Record<string, unknown>

export interface UpsertPartitionedClusteredTableOptions {
	datasetId: string
	tableId: string
	partitionField: string
	clusteringFields?: string[]
	schema?: TableField[]
}

type PartialFailureError = Error & {
	errors?: Array<Record<string, unknown>>
}

const USE_FREE_METHOD = true

/**
 * Insert JSON rows into a BigQuery table that is partitioned and clustered.
 * Creates the dataset/table if they do not already exist.
 */
export const createBigQueryClient = (): BigQuery => new BigQuery(resolveBigQueryOptions())

export async function upsertPartitionedClusteredTable(
	rows: BigQueryRow[],
	opts: UpsertPartitionedClusteredTableOptions
): Promise<void> {
	if (!Array.isArray(rows) || rows.length === 0) {
		throw new Error('rows must be a non-empty array')
	}

	const { datasetId, tableId, partitionField, clusteringFields = [], schema } = opts

	const bq = createBigQueryClient()
	const [dataset] = await bq.dataset(datasetId).get({ autoCreate: true })

	const effectiveSchema = schema ?? inferSchemaFromRows(rows)
	const timePartitioning = { type: 'DAY', field: partitionField } as const
	const clustering = clusteringFields.length ? { fields: clusteringFields } : undefined

	const tableRef = dataset.table(tableId)
	const [tableExists] = await tableRef.exists()

	if (!tableExists) {
		await dataset.createTable(tableId, {
			schema: { fields: effectiveSchema },
			timePartitioning,
			clustering
		})
		console.log(
			`Created table ${datasetId}.${tableId} (partition: ${partitionField}, cluster: ${clusteringFields.join(', ')})`
		)
	} else {
		console.log(
			`Table ${datasetId}.${tableId} already exists; assuming correct partitioning & clustering.`
		)
		await ensureSchemaCompatibility(tableRef, effectiveSchema)
	}

	if (USE_FREE_METHOD) {
		await insertViaLoadJob(tableRef, rows)
	} else {
		await insertViaStreamingInsert(tableRef, rows)
	}
}

async function insertViaStreamingInsert(tableRef: Table, rows: BigQueryRow[]): Promise<void> {
	try {
		await tableRef.insert(rows, { raw: true })
		console.log(`Inserted ${rows.length} rows via streaming.`)
	} catch (error) {
		const err = error as PartialFailureError
		if (err.name === 'PartialFailureError' && Array.isArray(err.errors)) {
			console.error('Some rows failed to insert.')
			err.errors.forEach((rowError, index) => {
				console.error(`Row #${index}:`, JSON.stringify(rowError, null, 2))
			})
		} else {
			console.error('Insert failed:', err.message)
		}
		throw err
	}
}

async function ensureSchemaCompatibility(tableRef: Table, desiredFields: TableField[]): Promise<void> {
	const [metadata] = await tableRef.getMetadata()
	const existingFields = metadata.schema?.fields ?? []
	const mergedFields = mergeFieldCollections(existingFields, desiredFields)
	if (schemasEqual(existingFields, mergedFields)) {
		return
	}
	await tableRef.setMetadata({ schema: { fields: mergedFields } })
	console.log(`Updated schema for ${tableRef.id} to accommodate new field definitions.`)
}

async function insertViaLoadJob(tableRef: Table, rows: BigQueryRow[]): Promise<void> {
	const { filePath, cleanup } = await writeRowsToTempNdjson(rows)
	try {
		await tableRef.load(filePath, {
			sourceFormat: 'NEWLINE_DELIMITED_JSON',
			writeDisposition: 'WRITE_APPEND'
		})
		console.log(`Loaded ${rows.length} rows via batch load.`)
	} catch (error) {
		console.error('Load job failed:', (error as Error).message)
		throw error
	} finally {
		await cleanup()
	}
}

async function writeRowsToTempNdjson(rows: BigQueryRow[]): Promise<{
	filePath: string
	cleanup: () => Promise<void>
}> {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bq-free-'))
	const filePath = path.join(dir, 'payload.ndjson')
	const serialized = rows.map(row => JSON.stringify(row)).join('\n')
	await fs.writeFile(filePath, serialized, 'utf8')
	return {
		filePath,
		cleanup: async () => {
			try {
				await fs.rm(dir, { recursive: true, force: true })
			} catch (error) {
				console.warn('Failed to clean up temp files:', error)
			}
		}
	}
}

/** Very lightweight schema inference for common JS types. Adjust for your needs. */
function inferSchemaFromRows(rows: BigQueryRow[]): TableField[] {
	const fieldMap = new Map<string, TableField>()
	for (const row of rows) {
		for (const [name, value] of Object.entries(row)) {
			if (value === undefined) {
				continue
			}
			const inferred = inferField(name, value)
			const existing = fieldMap.get(name)
			fieldMap.set(name, existing ? mergeFieldDefinitions(existing, inferred) : inferred)
		}
	}
	return Array.from(fieldMap.values())
}

function mergeFieldDefinitions(base: TableField, incoming: TableField): TableField {
	const merged: TableField = { ...base }
	if (incoming.mode === 'REPEATED' || base.mode === 'REPEATED') {
		merged.mode = 'REPEATED'
	}
	if (shouldPromoteToFloat(base.type, incoming.type)) {
		merged.type = 'FLOAT64'
	} else if (base.type === 'RECORD' && incoming.type === 'RECORD') {
		merged.fields = mergeFieldCollections(base.fields ?? [], incoming.fields ?? [])
	} else if (!merged.fields && incoming.fields) {
		merged.fields = incoming.fields
	}
	return merged
}

function mergeFieldCollections(baseFields: TableField[], incomingFields: TableField[]): TableField[] {
	const map = new Map<string, TableField>(baseFields.map(field => [field.name, { ...field }]))
	for (const field of incomingFields) {
		const existing = map.get(field.name)
		map.set(field.name, existing ? mergeFieldDefinitions(existing, field) : field)
	}
	return Array.from(map.values())
}

function schemasEqual(a: TableField[], b: TableField[]): boolean {
	return (
		JSON.stringify(sortFieldsForComparison(a)) === JSON.stringify(sortFieldsForComparison(b))
	)
}

function sortFieldsForComparison(fields: TableField[] = []): TableField[] {
	return [...fields]
		.sort((fieldA, fieldB) => fieldA.name.localeCompare(fieldB.name))
		.map(field => ({
			...field,
			fields: field.fields ? sortFieldsForComparison(field.fields) : undefined
		}))
}

function shouldPromoteToFloat(
	baseType: TableField['type'],
	incomingType: TableField['type']
): boolean {
	const involvesInteger = baseType === 'INT64' || incomingType === 'INT64'
	const involvesFloat = baseType === 'FLOAT64' || incomingType === 'FLOAT64'
	return involvesInteger && involvesFloat
}

function inferField(name: string, value: unknown): TableField {
	if (Array.isArray(value)) {
		const child = value.length > 0 ? inferField(name, value[0]) : undefined
		return {
			name,
			type: child?.type ?? 'STRING',
			mode: 'REPEATED',
			fields: child?.fields
		}
	}

	if (value instanceof Date) {
		return {
			name,
			type: 'TIMESTAMP',
			mode: 'NULLABLE'
		}
	}

	if (value && typeof value === 'object') {
		const subFields = Object.entries(value).map(([key, nested]) => inferField(key, nested))
		return {
			name,
			type: 'RECORD',
			mode: 'NULLABLE',
			fields: subFields
		}
	}

	let type: TableField['type'] = 'STRING'
	if (typeof value === 'number') {
		type = Number.isInteger(value) ? 'INT64' : 'FLOAT64'
	} else if (typeof value === 'boolean') {
		type = 'BOOL'
	} else if (isRFC3339Timestamp(value)) {
		type = 'TIMESTAMP'
	} else if (isISODate(value)) {
		type = 'DATE'
	}

	return {
		name,
		type,
		mode: 'NULLABLE'
	}
}

function isISODate(value: unknown): value is string {
	return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isRFC3339Timestamp(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value)
	)
}

const resolveBigQueryOptions = (): GoogleAuthOptions => {
	const options: GoogleAuthOptions = {}

	const encodedCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64
	if (!encodedCredentials) {
		throw new Error('GOOGLE_APPLICATION_CREDENTIALS_BASE64 env var is required.')
	}

	try {
		const decoded = Buffer.from(encodedCredentials, 'base64').toString('utf8')

		const parsed = JSON.parse(decoded) as {
			type: string
			project_id: string
			private_key_id: string
			private_key: string
			client_email: string
			client_id: string
			auth_uri: string
			token_uri: string
			auth_provider_x509_cert_url: string
			client_x509_cert_url: string
			universe_domain?: string
		}

		// --- map here ---
		options.projectId = parsed.project_id
		options.universeDomain = parsed.universe_domain
		options.scopes = 'https://www.googleapis.com/auth/cloud-platform'

		// Important: normalize the private key newlines
		const privateKey = parsed.private_key?.replace(/\\n/g, '\n')

		// Provide a JWT-style credentials object (no file path needed)
		options.credentials = {
			type: parsed.type,
			project_id: parsed.project_id,
			private_key_id: parsed.private_key_id,
			private_key: privateKey,
			client_email: parsed.client_email,
			client_id: parsed.client_id,
			auth_uri: parsed.auth_uri,
			token_uri: parsed.token_uri,
			auth_provider_x509_cert_url: parsed.auth_provider_x509_cert_url,
			client_x509_cert_url: parsed.client_x509_cert_url,
			// universe_domain is supported in some newer key formats; include if present
			universe_domain: parsed.universe_domain
		} as JWTInput
		// --- end mapping ---
	} catch (error) {
		console.warn('Failed to parse GOOGLE_*_BASE64 credentials env var:', error)
	}

	return options
}
