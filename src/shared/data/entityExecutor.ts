import { createBigQueryClient } from '../vendors/google/bigquery/bigquery';
import type { Entity } from '../../jobs/base';

export class EntityExecutor {
	constructor(private readonly projectId: string) {}

	async run(entity: Entity<any>): Promise<void> {
		const bq = createBigQueryClient();
		const { partitionBy, clusterBy } = entity.definition;

		const datasetRef = bq.dataset(entity.dataset);
		const [datasetExists] = await datasetRef.exists();
		if (!datasetExists) {
			await datasetRef.create({ location: 'US' });
			console.log(`Created dataset ${entity.dataset} in location US.`);
		}

		const fullTableId = `${this.projectId}.${entity.fqn}`;
		
		let ddl = `CREATE OR REPLACE TABLE \`${fullTableId}\`\n`;
		if (partitionBy) {
			ddl += `PARTITION BY ${partitionBy}\n`;
		}
		if (clusterBy && clusterBy.length > 0) {
			ddl += `CLUSTER BY ${clusterBy.join(', ')}\n`;
		}
		ddl += `AS\n${entity.getTransformQuery()}`;

		console.log(`Executing Entity Job for ${entity.id}...`);
		console.log(`Target: ${fullTableId}`);
		console.log(`DDL: ${ddl}`);

		try {
			const [job] = await bq.createQueryJob({
				query: ddl,
				location: 'US'
			});
			console.log(`Job ${job.id} started.`);

			await job.getQueryResults();
			console.log(`Job ${job.id} completed.`);
		} catch (error) {
			console.error(`Failed to materialize entity ${entity.id}:`, error);
			throw error;
		}
	}
}
