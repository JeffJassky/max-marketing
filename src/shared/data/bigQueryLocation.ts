import type { BigQuery, Dataset } from '@google-cloud/bigquery'

type DatasetInfo = {
	ref: Dataset
	exists: boolean
	location?: string
}

/** Fetch dataset existence + location metadata without throwing if missing. */
export async function getDatasetInfo(
	bq: BigQuery,
	datasetId: string
): Promise<DatasetInfo> {
	const ref = bq.dataset(datasetId)
	const [exists] = await ref.exists()

	let location: string | undefined
	if (exists) {
		const [metadata] = await ref.getMetadata()
		location = metadata.location
	}

	return { ref, exists, location }
}

/** Choose the first known location from the provided datasets, defaulting to US. */
export function resolveDatasetLocation(...datasets: DatasetInfo[]): string {
	for (const dataset of datasets) {
		if (dataset.location) return dataset.location
	}
	return 'US'
}
