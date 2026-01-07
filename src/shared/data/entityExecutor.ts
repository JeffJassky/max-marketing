import { createBigQueryClient } from '../vendors/google/bigquery/bigquery';
import type { Entity } from '../../jobs/base';
import { getDatasetInfo, resolveDatasetLocation } from './bigQueryLocation';

export class EntityExecutor {
	constructor(private readonly projectId: string) {}

	async run(entity: Entity<any>): Promise<void> {
		const bq = createBigQueryClient();
		const { partitionBy, clusterBy } = entity.definition;

		const targetDataset = await getDatasetInfo(bq, entity.dataset);
		
		// Check all sources
		const sourceDatasets = await Promise.all(
			entity.definition.sources.map(s => getDatasetInfo(bq, s.dataset))
		);

		const location = resolveDatasetLocation(targetDataset, ...sourceDatasets);

		if (!targetDataset.exists) {
			await targetDataset.ref.create({ location });
			console.log(
				`Created dataset ${entity.dataset} in location ${location}.`
			);
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
				location
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
