import { createBigQueryClient } from '../vendors/google/bigquery/bigquery';
import type { Entity } from '../../jobs/base';
import { getDatasetInfo, resolveDatasetLocation } from './bigQueryLocation';

export interface EntityRunOptions {
	/** When set, performs incremental update: DELETE recent partitions + INSERT. When omitted, does full CREATE OR REPLACE. */
	incrementalDays?: number;
}

export class EntityExecutor {
	constructor(private readonly projectId: string) {}

	async run(entity: Entity<any>, options?: EntityRunOptions): Promise<void> {
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
		const incrementalDays = options?.incrementalDays;

		// Check if we can do incremental (table must already exist)
		if (incrementalDays) {
			const tableExists = await this.tableExists(bq, fullTableId, location);
			if (tableExists) {
				await this.runIncremental(bq, entity, fullTableId, location, incrementalDays);
				return;
			}
			console.log(`Table ${fullTableId} does not exist yet — falling back to full rebuild.`);
		}

		// Full rebuild (CREATE OR REPLACE)
		await this.runFullRebuild(bq, entity, fullTableId, location);
	}

	private async tableExists(bq: any, fullTableId: string, location: string): Promise<boolean> {
		try {
			const [rows] = await bq.query({
				query: `SELECT 1 FROM \`${fullTableId}\` LIMIT 0`,
				location,
			});
			return true;
		} catch {
			return false;
		}
	}

	private async runFullRebuild(bq: any, entity: Entity<any>, fullTableId: string, location: string): Promise<void> {
		const { partitionBy, clusterBy } = entity.definition;

		let ddl = `CREATE OR REPLACE TABLE \`${fullTableId}\`\n`;
		if (partitionBy) {
			ddl += `PARTITION BY ${partitionBy}\n`;
		}
		if (clusterBy && clusterBy.length > 0) {
			ddl += `CLUSTER BY ${clusterBy.join(', ')}\n`;
		}
		ddl += `AS\n${entity.getTransformQuery()}`;

		console.log(`Executing Entity Job for ${entity.id} (full rebuild)...`);
		console.log(`Target: ${fullTableId}`);

		const [job] = await bq.createQueryJob({ query: ddl, location });
		console.log(`Job ${job.id} started.`);
		await job.getQueryResults();
		console.log(`Job ${job.id} completed.`);
	}

	private async runIncremental(bq: any, entity: Entity<any>, fullTableId: string, location: string, days: number): Promise<void> {
		const dateFilter = `DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)`;
		const transformQuery = entity.getTransformQuery({ dateFilter });

		// Dry-run the INSERT to detect schema mismatches before deleting any data
		const insertSql = `INSERT INTO \`${fullTableId}\`\n${transformQuery}`;
		try {
			await bq.createQueryJob({ query: insertSql, location, dryRun: true });
		} catch (dryRunError: any) {
			if (dryRunError.message?.includes('column count') || dryRunError.message?.includes('wrong column')) {
				console.log(`Schema mismatch detected for ${entity.id} — falling back to full rebuild.`);
				await this.runFullRebuild(bq, entity, fullTableId, location);
				return;
			}
			// Other dry-run errors are unexpected — let them propagate
			throw dryRunError;
		}

		// Step 1: DELETE recent partitions
		const deleteSql = `DELETE FROM \`${fullTableId}\` WHERE date >= ${dateFilter}`;

		console.log(`Executing Entity Job for ${entity.id} (incremental, last ${days} days)...`);
		console.log(`Target: ${fullTableId}`);
		console.log(`Step 1: DELETE WHERE date >= ${dateFilter}`);

		const [deleteJob] = await bq.createQueryJob({ query: deleteSql, location });
		await deleteJob.getQueryResults();
		console.log(`Delete job ${deleteJob.id} completed.`);

		// Step 2: INSERT new data for the recent window
		console.log(`Step 2: INSERT recent data`);

		const [insertJob] = await bq.createQueryJob({ query: insertSql, location });
		await insertJob.getQueryResults();
		console.log(`Insert job ${insertJob.id} completed.`);
	}
}
