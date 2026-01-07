import type { TableField } from '@google-cloud/bigquery';
import { WindsorRequestParams } from './windsor.d';
import { BronzeImport } from '../../../jobs/base';
import { windsor } from './windsor';
import {
	type BigQueryRow,
	upsertPartitionedClusteredTable
} from '../google/bigquery/bigquery';
import { zodToBigQuerySchema } from '../../data/zodToBigQuery';

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

		const effectiveSchema = options.schemaOverride ?? zodToBigQuerySchema(importObj.schema);

    console.log("DEBUG: Effective BigQuery Schema:");
    console.log(JSON.stringify(effectiveSchema, null, 2));

    if (rows.length > 0) {
      console.log("DEBUG: Sample Row (First Item):");
      console.log(JSON.stringify(rows[0], null, 2));
    }

		await upsertPartitionedClusteredTable(rows as BigQueryRow[], {
			datasetId: importObj.dataset,
			tableId: importObj.tableName,
			partitionField: importObj.definition.partitionBy,
			clusteringFields: importObj.definition.clusterBy,
			schema: effectiveSchema
		});

		return {
			importObj,
			rowCount: rows.length,
			meta: { requestedAt }
		};
	}
}
