import { createBigQueryClient } from '../vendors/google/bigquery/bigquery'
import type { Entity } from './types'

export class EntityExecutor {
	constructor(private readonly projectId: string) {}

	async run(entity: Entity): Promise<void> {
		const bq = createBigQueryClient()
		const { dataset, table, partitionBy, clusterBy } = entity.pipeline.storage
		const { sql } = entity.pipeline.transform

		const fullTableId = `${dataset}.${table}`

		// Ensure dataset exists
		await bq.dataset(dataset).get({ autoCreate: true })

		const safeClusterBy = (clusterBy ?? []).map(c => c.replace(/[^a-zA-Z0-9_]/g, ''))
		const partitionClause = partitionBy ? `PARTITION BY ${partitionBy} ` : ''
		const clusterClause = safeClusterBy.length ? `CLUSTER BY ${safeClusterBy.join(', ')} ` : ''
		const ddl = `CREATE OR REPLACE TABLE \`${fullTableId}\` ${partitionClause}${clusterClause}AS\n${sql}`

		console.log(`Executing Entity Job for ${entity.id}...`)
		console.log(`Target: ${fullTableId}`)
		
		try {
			const [job] = await bq.createQueryJob({
				query: ddl,
				location: 'US',
			})
			console.log(`Job ${job.id} started.`)
			
			const [rows] = await job.getQueryResults()
			console.log(`Job ${job.id} completed.`)
		} catch (error) {
			console.error(`Failed to materialize entity ${entity.id}:`, error)
			throw error
		}
	}
}
