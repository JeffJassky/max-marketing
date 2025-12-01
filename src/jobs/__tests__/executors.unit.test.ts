import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EntityExecutor } from '../../shared/data/entityExecutor'
import { SignalExecutor } from '../../shared/data/signalExecutor'
import { createBigQueryClient, upsertPartitionedClusteredTable } from '../../shared/vendors/google/bigquery/bigquery'
import { Entity, Signal } from '../../shared/data/types'

// Mock BigQuery dependencies
vi.mock('../../shared/vendors/google/bigquery/bigquery', () => ({
	createBigQueryClient: vi.fn(),
	upsertPartitionedClusteredTable: vi.fn()
}))

describe('Executors', () => {
	const mockBq = {
		createQueryJob: vi.fn(),
		dataset: vi.fn()
	}
	const mockJob = {
		getQueryResults: vi.fn(),
		id: 'job_123'
	}

	beforeEach(() => {
		vi.clearAllMocks()
		// @ts-ignore
		createBigQueryClient.mockReturnValue(mockBq)
		mockBq.createQueryJob.mockResolvedValue([mockJob])
		mockJob.getQueryResults.mockResolvedValue([[]]) // Default no rows
	})

	describe('EntityExecutor', () => {
		it('generates correct DDL for an entity', async () => {
			const executor = new EntityExecutor('test-project')
			const entity: Entity = {
				id: 'TestEntity',
				description: 'Test',
				pipeline: {
					sources: [],
					transform: {
						mode: 'sql',
						sql: 'SELECT * FROM source'
					},
					storage: {
						dataset: 'silver',
						table: 'test_table',
						materialized: true,
						partitionBy: 'date',
						clusterBy: ['id']
					}
				},
				grain: [],
				metrics: {},
				dimensions: {}
			}

			await executor.run(entity)

			expect(mockBq.createQueryJob).toHaveBeenCalledWith(expect.objectContaining({
				query: expect.stringContaining('CREATE OR REPLACE TABLE `silver.test_table`')
			}))
			expect(mockBq.createQueryJob).toHaveBeenCalledWith(expect.objectContaining({
				query: expect.stringContaining('PARTITION BY date')
			}))
			expect(mockBq.createQueryJob).toHaveBeenCalledWith(expect.objectContaining({
				query: expect.stringContaining('CLUSTER BY id')
			}))
			expect(mockBq.createQueryJob).toHaveBeenCalledWith(expect.objectContaining({
				query: expect.stringContaining('AS\nSELECT * FROM source')
			}))
		})
	})

	describe('SignalExecutor', () => {
		it('translates predicate and executes query', async () => {
			const executor = new SignalExecutor('test-project')
			const entity: Entity = {
				id: 'TestEntity',
				description: 'Test',
				pipeline: {
					sources: [],
					transform: { mode: 'sql', sql: '' },
					storage: {
						dataset: 'silver',
						table: 'test_table',
						materialized: true
					}
				},
				grain: [],
				metrics: {},
				dimensions: {}
			}
			const signal: Signal = {
				id: 'testSignal',
				kind: 'opportunity',
				signalType: 'deterministic',
				targets: [],
				applicability: {} as any,
				predicate: {
					mode: 'expression',
					expression: 'spend >= 100 && clicks == 0'
				},
				output: {
					keyFields: ['id'],
					impact: { formula: 'spend', unit: 'currency', direction: 'positive' },
					confidence: { mode: 'fixed', value: 0.9 }
				},
				presentation: {} as any
			}

			// Mock finding rows
			mockJob.getQueryResults.mockResolvedValue([[{ id: '1', spend: 100 }]])

			await executor.run(signal, entity)

			// Verify Query
			expect(mockBq.createQueryJob).toHaveBeenCalledWith(expect.objectContaining({
				query: expect.stringContaining('FROM `silver.test_table`')
			}))
			// Verify Predicate Translation
			expect(mockBq.createQueryJob).toHaveBeenCalledWith(expect.objectContaining({
				query: expect.stringContaining('WHERE spend >= 100 AND clicks = 0')
			}))
			// Verify Selection
			expect(mockBq.createQueryJob).toHaveBeenCalledWith(expect.objectContaining({
				query: expect.stringContaining("'testSignal' as signal_id")
			}))

			// Verify Upsert
			expect(upsertPartitionedClusteredTable).toHaveBeenCalledWith(
				expect.arrayContaining([expect.objectContaining({ id: '1' })]),
				expect.objectContaining({
					datasetId: 'gold_signals',
					tableId: 'testSignal',
					partitionField: 'detected_at'
				})
			)
		})
	})
})
