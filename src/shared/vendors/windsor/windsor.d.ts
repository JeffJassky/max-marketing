import { WindsorMetric, WindsorDimension } from './const.js'
export type WindsorConnector =
	| 'facebook'
	| 'facebook_organic'
	| 'google_ads'
	| 'googleanalytics4'
	| 'instagram'
	| 'searchconsole'

export type WindsorDatePreset =
	| 'today'
	| 'yesterday'
	| 'last_7d'
	| 'last_30d'
	| 'last_90d'
	| 'last_month'
	| 'last_year'

export type WindsorDateAggregation = 'day' | 'week' | 'month' | 'year'

export type WindsorOrder = 'asc' | 'desc'

export type WindsorFilterOperator =
	| 'eq'
	| 'neq'
	| 'gt'
	| 'gte'
	| 'lt'
	| 'lte'
	| 'contains'
	| 'ncontains'
	| 'null'
	| 'notnull'

export type WindsorFilterPrimitive = string | number | boolean | null

export type WindsorFilterCondition = [string, WindsorFilterOperator, WindsorFilterPrimitive]

export type WindsorFilterConjunction = 'and' | 'or'

export type WindsorFilterExpression =
	| WindsorFilterCondition
	| [WindsorFilterExpression, WindsorFilterConjunction, WindsorFilterExpression]

export interface WindsorRequestParams {
	date_from?: string
	date_to?: string
	date_preset?: WindsorDatePreset
	date_aggregation?: WindsorDateAggregation
	sort?: string
	order?: WindsorOrder
	limit?: number
	offset?: number
	filter?: WindsorFilterExpression
	select_accounts?: string | string[]
}

export interface WindsorEndpointDefinition<
	Connector extends WindsorConnector,
	Metric extends readonly WindsorMetric<Connector>[],
	Dimension extends readonly WindsorDimension<Connector>[]
> {
	connector: Connector
	metrics: Metric
	dimensions: Dimension
	requiredDimensions?: readonly WindsorDimension[]
	defaultDatePreset?: WindsorDatePreset
}

export declare const windsorEndpoints: Record<
	string,
	WindsorEndpointDefinition<
		WindsorConnector,
		readonly WindsorMetric[],
		readonly WindsorDimension[]
	>
>

export type WindsorEndpoint = string

export type EndpointMetrics<E extends WindsorEndpoint = string> = string

export type EndpointDimensions<E extends WindsorEndpoint = string> = string

export type WindsorRow<E extends WindsorEndpoint = string> = Partial<
	Record<string, WindsorFilterPrimitive>
>

export interface WindsorResponseMeta {
	total_count?: number
	returned_count?: number
}

export interface WindsorResponse<E extends WindsorEndpoint = string> {
	data: WindsorRow<E>[]
	meta?: WindsorResponseMeta
}

export interface WindsorRequest<E extends WindsorEndpoint = string> {
	endpoint: E
	connector?: WindsorConnector | string
	metrics: string[]
	dimensions: string[]
	params?: WindsorRequestParams
}

export interface WindsorImportDestination {
	dataset: string
	table: string
	partition_by?: 'date'
	cluster_by?: string[]
	schema_version: number
}

export interface WindsorImportQuery<E extends WindsorEndpoint = string> {
	connector: string
	platform: string
	datasetId: string
	description: string
	request: WindsorRequest<E>
	destination: WindsorImportDestination
	backfillPresets?: WindsorDatePreset[]
}

export type WindsorImportRegistry = Record<string, WindsorImportQuery>

export declare function windsorRequest<E extends WindsorEndpoint>(
	request: WindsorRequest<E>
): Promise<WindsorResponse<E>>

export declare const windsor: {
	endpoints: typeof windsorEndpoints
	request: typeof windsorRequest
}

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			WINDSOR_API_KEY?: string
		}
	}
}
