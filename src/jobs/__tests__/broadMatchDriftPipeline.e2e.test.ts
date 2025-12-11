import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import { WindsorImportExecutor } from '../../shared/vendors/windsor/windsorPresetExecutor';
import { EntityExecutor } from '../../shared/data/entityExecutor';
import { SignalExecutor } from '../../shared/data/signalExecutor';
import { createBigQueryClient } from '../../shared/vendors/google/bigquery/bigquery';

import { googleAdsCoreSearchTermPerformance } from '../imports/google_ads/core-search-term-performance.import';
import { searchTermDaily } from '../entities/search-term-daily/search-term-daily.entity';
import { broadMatchDriftSearchTerm } from '../entities/search-term-daily/signals/broad-match-drift.signal';

// Load env for live runs (root + app-specific)
loadEnv();
loadEnv({ path: path.resolve(process.cwd(), '.env'), override: false });

const requireEnv = (name: string) => {
	if (!process.env[name]) {
		throw new Error(`Env var ${name} is required for live Windsor/BigQuery tests.`);
	}
};

describe('broadMatchDrift pipeline (live)', () => {
	beforeAll(() => {
		requireEnv('WINDSOR_API_KEY');
		requireEnv('GOOGLE_APPLICATION_CREDENTIALS_BASE64');
    requireEnv('BIGQUERY_PROJECT_ID');
	});

	it('runs the Windsor bronze import preset against the live API and writes to bronze', async () => {
		const executor = new WindsorImportExecutor();
		const result = await executor.run(googleAdsCoreSearchTermPerformance);

		expect(result.importObj.id).toBe(googleAdsCoreSearchTermPerformance.id);

		console.log(
			`Imported ${result.rowCount} rows into ${googleAdsCoreSearchTermPerformance.fqn}`
		);
	}, 180_000);

	it('materializes the searchTermDaily entity into silver_marketing from live bronze data', async () => {
		const entityExecutor = new EntityExecutor(process.env.BIGQUERY_PROJECT_ID ?? '');
		await entityExecutor.run(searchTermDaily);

		const bq = createBigQueryClient();
		const table = bq
			.dataset(searchTermDaily.dataset)
			.table(searchTermDaily.tableName);
		const [metadata] = await table.getMetadata();

		expect(metadata.tableReference?.tableId).toBe(searchTermDaily.tableName);
	}, 180_000);

	it('executes the broadMatchDriftSearchTerm signal against silver and writes gold_signals data', async () => {
		const signalExecutor = new SignalExecutor(process.env.BIGQUERY_PROJECT_ID ?? '');
		await signalExecutor.run(broadMatchDriftSearchTerm);

		const bq = createBigQueryClient();
		const [rows] = await bq.query({
			location: 'US',
			query: `
          SELECT *
          FROM \`${broadMatchDriftSearchTerm.dataset}.${broadMatchDriftSearchTerm.tableName}\`
          ORDER BY detected_at DESC
          LIMIT 10
        `
		});

		console.log(`Fetched ${rows.length} gold rows for ${broadMatchDriftSearchTerm.id}`);
		expect(Array.isArray(rows)).toBe(true);
	}, 180_000);
});
