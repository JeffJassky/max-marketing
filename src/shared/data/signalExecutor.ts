import {
	createBigQueryClient,
	upsertPartitionedClusteredTable
} from '../vendors/google/bigquery/bigquery'
import type { Signal, Entity } from './types'
import knex from 'knex'
import jsep from 'jsep'

const qb = knex({ client: 'pg' }) // Generic SQL builder

export interface SignalRunOptions {
	startDate?: string // YYYY-MM-DD
	endDate?: string // YYYY-MM-DD
	dateField?: string // defaults to 'date'
	windowId?: string // e.g. 'last_90d'
}

export class SignalExecutor {
	constructor(private readonly projectId: string) {}

	async run(signal: Signal, sourceEntity: Entity, options: SignalRunOptions = {}): Promise<void> {
		const bq = createBigQueryClient()

		// 1. Resolve Source Table
		const { dataset, table } = sourceEntity.pipeline.storage
		const sourceTableId = `${dataset}.${table}`

		// 2. Translate Predicate (JS AST -> SQL)
		const whereClause = this.translatePredicate(signal.predicate.expression)
		const { startDate, endDate, dateField } = this.resolveWindow(options, signal)

		// 3. Build Query using Knex
		const impactExpr = signal.output.impact.formula
		const confidenceVal = signal.output.confidence.value

		const query = qb
			.select('*')
			.select(qb.raw(`'${signal.id}' as signal_id`))
			.select(qb.raw('CURRENT_TIMESTAMP() as detected_at'))
			.select(qb.raw(`${impactExpr} as impact`))
			.select(qb.raw(`${confidenceVal} as confidence`))
			.from(qb.raw(`\`${sourceTableId}\``)) // Raw for BQ table syntax
			.whereRaw(whereClause)
			.modify(builder => {
				if (startDate) {
					builder.whereRaw(`${dateField} >= ${startDate}`)
				}
				if (endDate) {
					builder.whereRaw(`${dateField} <= ${endDate}`)
				}
			})
			.toQuery()

		console.log(`Executing Signal Job for ${signal.id}...`)
		console.log(`Source: ${sourceTableId}`)
		console.log(`Query: ${query}`)

		// 4. Execute Query to get Signals
		const [job] = await bq.createQueryJob({ query, location: 'US' })
		const [rows] = await job.getQueryResults()

		console.log(`Found ${rows.length} signals.`)

		if (rows.length === 0) return

		const serializableRows = rows.map(rawRow => {
			const row = JSON.parse(JSON.stringify(rawRow))
			const normalizedEntries = Object.entries(row).map(([key, value]) => {
				if (value instanceof Date) {
					// Keep date-only fields as YYYY-MM-DD so they infer as DATE
					const iso = value.toISOString()
					return [key, key === 'date' ? iso.slice(0, 10) : iso]
				}
				return [key, value]
			})
			const normalizedRow = Object.fromEntries(normalizedEntries)
			if (normalizedRow.date) {
				const dateCandidate = normalizedRow.date
				const parsed = new Date(dateCandidate)
				normalizedRow.date = Number.isNaN(parsed.getTime())
					? new Date().toISOString().slice(0, 10)
					: parsed.toISOString().slice(0, 10)
			}
			const detected = row.detected_at ?? row.detectedAt
			const detectedDate = detected ? new Date(detected) : new Date()
			const detectedIso = Number.isNaN(detectedDate.getTime())
				? new Date().toISOString()
				: detectedDate.toISOString()
			return {
				...normalizedRow,
				detected_at: detectedIso
			}
		})

		// 5. Write to Gold Layer
		const destDataset = 'gold_signals'
		const destTable = signal.id

		await upsertPartitionedClusteredTable(serializableRows, {
			datasetId: destDataset,
			tableId: destTable,
			partitionField: 'detected_at',
			clusteringFields: signal.output.keyFields
		})
	}

	private translatePredicate(expression: string): string {
		const parseTree = jsep(expression)
		return this.astToSql(parseTree)
	}

	private astToSql(node: jsep.Expression): string {
		switch (node.type) {
			case 'BinaryExpression': {
				const binary = node as jsep.BinaryExpression
				const left = this.astToSql(binary.left)
				const right = this.astToSql(binary.right)
				const op = this.mapOperator(binary.operator)
				return `(${left} ${op} ${right})`
			}
			case 'LogicalExpression': {
				const logical = node as jsep.BinaryExpression
				const left = this.astToSql(logical.left)
				const right = this.astToSql(logical.right)
				const op = logical.operator === '&&' ? 'AND' : 'OR'
				return `(${left} ${op} ${right})`
			}
			case 'Identifier': {
				return (node as jsep.Identifier).name
			}
			case 'Literal': {
				const literal = node as jsep.Literal
				return typeof literal.value === 'string'
					? `'${literal.value}'`
					: String(literal.value)
			}
			default:
				throw new Error(`Unsupported expression type: ${node.type}`)
		}
	}

	private mapOperator(op: string): string {
		switch (op) {
			case '&&':
				return 'AND'
			case '||':
				return 'OR'
			case '==':
				return '='
			case '===':
				return '='
			case '!=':
				return '<>'
			case '!==':
				return '<>'
			default:
				return op
		}
	}

	private resolveWindow(options: SignalRunOptions, signal: Signal): {
		startDate?: string
		endDate?: string
		dateField: string
	} {
		const dateField = options.dateField ?? 'date'
		const windowId = options.windowId ?? signal.snapshot?.windowId

		if (options.startDate || options.endDate) {
			return {
				startDate: options.startDate ? `'${options.startDate}'` : undefined,
				endDate: options.endDate ? `'${options.endDate}'` : undefined,
				dateField
			}
		}

		const startFromWindow = this.mapWindowIdToStart(windowId)
		return {
			startDate: startFromWindow,
			endDate: undefined,
			dateField
		}
	}

	private mapWindowIdToStart(windowId?: string): string | undefined {
		switch (windowId) {
			case 'last_7d':
				return 'DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)'
			case 'last_30d':
				return 'DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)'
			case 'last_60d':
				return 'DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)'
			case 'last_90d':
				return 'DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)'
			case 'last_month':
				return 'DATE_SUB(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 1 MONTH)'
			case 'last_year':
				return 'DATE_SUB(DATE_TRUNC(CURRENT_DATE(), YEAR), INTERVAL 1 YEAR)'
			default:
				return undefined
		}
	}
}
