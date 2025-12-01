import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

import { WindsorImportExecutor } from '../../shared/vendors/windsor/windsorPresetExecutor'
import { windsorImportQueries } from '../imports'
import { EntityExecutor } from '../../shared/data/entityExecutor'
import { SignalExecutor } from '../../shared/data/signalExecutor'
import { keywordDaily } from '../entities'
import { wastedSpendKeyword } from '../signals'
import { createBigQueryClient } from '../../shared/vendors/google/bigquery/bigquery'

const presetKey = 'googleAdsCoreKeywordPerformance' as const

// Load env for live runs (root + app-specific)
loadEnv()
loadEnv({ path: path.resolve(process.cwd(), 'apps/MaxMarketing/.env'), override: false })

const requireEnv = (name: string) => {
	if (!process.env[name]) {
		throw new Error(`Env var ${name} is required for live Windsor/BigQuery tests.`)
	}
}

describe('wastedSpendKeyword pipeline (live)', () => {
	beforeAll(() => {
		requireEnv('WINDSOR_API_KEY')
		requireEnv('GOOGLE_APPLICATION_CREDENTIALS_BASE64')
	})

	it('runs the Windsor bronze import preset against the live API and writes to bronze', async () => {
		const executor = new WindsorImportExecutor()
		const result = await executor.run(presetKey)

		const preset = windsorImportQueries[presetKey]
		expect(result.preset.datasetId).toBe(preset.datasetId)

		console.log(
			`Imported ${result.rowCount} rows into ${preset.destination.dataset}.${preset.destination.table}`
		)
	}, 180_000)

	it('materializes the keywordDaily entity into silver_marketing from live bronze data', async () => {
		const entityExecutor = new EntityExecutor(process.env.BIGQUERY_PROJECT_ID ?? '')
		await entityExecutor.run(keywordDaily)

		const bq = createBigQueryClient()
		const table = bq
			.dataset(keywordDaily.pipeline.storage.dataset)
			.table(keywordDaily.pipeline.storage.table)
		const [metadata] = await table.getMetadata()

		expect(metadata.tableReference?.tableId).toBe(keywordDaily.pipeline.storage.table)
	}, 180_000)

	it('executes the wastedSpendKeyword signal against silver and writes gold_signals data', async () => {
		const signalExecutor = new SignalExecutor(process.env.BIGQUERY_PROJECT_ID ?? '')
		await signalExecutor.run(wastedSpendKeyword, keywordDaily)

		const bq = createBigQueryClient()
		const [rows] = await bq.query({
			location: 'US',
			query: `
          SELECT *
          FROM \`gold_signals.${wastedSpendKeyword.id}\`
          ORDER BY detected_at DESC
          LIMIT 10
        `
		})

		console.log(`Fetched ${rows.length} gold rows for ${wastedSpendKeyword.id}`)
		expect(Array.isArray(rows)).toBe(true)
	}, 180_000)
})
