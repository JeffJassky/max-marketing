import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'

loadEnv()
loadEnv({ path: path.resolve(process.cwd(), 'apps/MaxMarketing/.env'), override: false })
import type { Table } from '@google-cloud/bigquery'

import { WindsorImportExecutor } from '../../shared/vendors/windsor/windsorPresetExecutor'
import type { WindsorImportKey } from '../imports'
import { windsorImportQueries } from '../imports'
import { createBigQueryClient } from '../../shared/vendors/google/bigquery/bigquery'

const isE2EEnabled = process.env.WINDSOR_E2E === 'true'

/**
 * Executes a full Windsor → BigQuery run against live services.
 * Opt-in by setting WINDSOR_E2E=true plus BIGQUERY_PROJECT_ID/ WINDSOR_API_KEY env vars.
 */

describe.skipIf(!isE2EEnabled)('WindsorImportExecutor (e2e)', () => {
	const presetKey = (process.env.WINDSOR_E2E_PRESET ??
		'facebookPurchaseAttribution30d') as WindsorImportKey

	const preset = windsorImportQueries[presetKey]

	if (!preset) {
		throw new Error(`Preset "${presetKey}" does not exist.`)
	}

	let bigquery: ReturnType<typeof createBigQueryClient>
	let executor: WindsorImportExecutor

	beforeAll(() => {
		bigquery = createBigQueryClient()
		executor = new WindsorImportExecutor()
	})

	it('syncs preset rows into BigQuery and ensures partition/cluster metadata is set', async () => {
		const result = await executor.run(presetKey)

		expect(result.preset.id).toBe(preset.id)
		expect(result.meta.requestedAt).toBeInstanceOf(Date)
		expect(result.rowCount).toBeGreaterThanOrEqual(0)

		const table = bigquery.dataset(preset.destination.dataset).table(preset.destination.table)
		const [metadata] = await table.getMetadata()

		expect(metadata.tableReference?.tableId).toBe(preset.destination.table)

		if (preset.destination.partition_by) {
			expect(metadata.timePartitioning?.field).toBe(preset.destination.partition_by)
		}

		if (preset.destination.cluster_by?.length) {
			expect(metadata.clustering?.fields).toEqual(preset.destination.cluster_by)
		}

		if (result.rowCount > 0) {
			const rows = await waitForRows(table)
			expect(rows.length).toBeGreaterThan(0)
		}
	}, 120_000)
})

async function waitForRows(table: Table): Promise<Record<string, unknown>[]> {
	for (let attempt = 0; attempt < 5; attempt += 1) {
		const [rows] = await table.getRows({ maxResults: 1 })
		if (rows.length) {
			return rows as Record<string, unknown>[]
		}
		await new Promise(resolve => setTimeout(resolve, 2000))
	}
	return []
}
