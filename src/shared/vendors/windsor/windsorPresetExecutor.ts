import type { TableField } from '@google-cloud/bigquery';
import { WindsorRequestParams } from './windsor.d';
import { BronzeImport } from '../../../jobs/base';
import { windsor } from './windsor';
import {
	type BigQueryRow,
	upsertPartitionedClusteredTable
} from '../google/bigquery/bigquery';

export interface WindsorImportRunOptions {
	requestOverrides?: WindsorRequestParams;
	schemaOverride?: TableField[];
}

export interface WindsorImportExecutionResult {
	  importObj: BronzeImport<any, any>;	rowCount: number;
	meta: { requestedAt: Date };
}

/**
 * Orchestrates executing a Windsor import and persisting the response into BigQuery.
 */
export class WindsorImportExecutor {
	constructor() {}

	async run(
		   importObj: BronzeImport<any, any>,		options: WindsorImportRunOptions = {}
	): Promise<WindsorImportExecutionResult> {
		const requestedAt = new Date();

		const finalRequest = importObj.getRequest(options.requestOverrides);

		const response = await windsor.request(finalRequest);
		const rows = response.data ?? [];

		if (!rows.length) {
			return { importObj, rowCount: 0, meta: { requestedAt } };
		}

		await upsertPartitionedClusteredTable(rows as BigQueryRow[], {
			datasetId: importObj.dataset,
			tableId: importObj.tableName,
			partitionField: importObj.definition.partitionBy,
			clusteringFields: importObj.definition.clusterBy,
			schema: options.schemaOverride
		});

		return {
			importObj,
			rowCount: rows.length,
			meta: { requestedAt }
		};
	}
}
