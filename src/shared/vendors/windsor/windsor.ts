import {
	WindsorEndpoint,
	EndpointMetrics,
	EndpointDimensions,
	WindsorRequest,
	WindsorRequestParams,
	WindsorResponse
} from './windsor.d'

import {
	WINDSOR_DEFAULT_REQUIRED_DIMENSION,
	WINDSOR_FILTER_KEYS,
	WINDSOR_API_BASE
} from './const.js'

import { windsorEndpoints } from './endpoints.js'

const ensureApiKey = (): string => {
	const apiKey = process.env.WINDSOR_API_KEY
	if (!apiKey) {
		throw new Error('Missing Windsor API key. Please set WINDSOR_API_KEY in your environment.')
	}
	return apiKey
}

const buildFieldsString = (metrics: string[], dimensions: string[]): string => {
	const fields = new Set<string>([...dimensions, ...metrics])
	return Array.from(fields).join(',')
}

const validateRequest = <E extends WindsorEndpoint>(request: WindsorRequest<E>): void => {
	const catalog = windsorEndpoints[request.endpoint]

	const requiredDimensions = catalog.requiredDimensions ?? [WINDSOR_DEFAULT_REQUIRED_DIMENSION]

	requiredDimensions.forEach(dimension => {
		if (!request.dimensions.includes(dimension as EndpointDimensions<E>)) {
			throw new Error(`Endpoint "${request.endpoint}" requires dimension "${dimension}".`)
		}
	})

	request.metrics.forEach(metric => {
		if (!catalog.metrics.includes(metric as EndpointMetrics<E>)) {
			throw new Error(
				`Metric "${metric}" is not supported by endpoint "${request.endpoint}".`
			)
		}
	})

	request.dimensions.forEach(dimension => {
		if (!catalog.dimensions.includes(dimension as EndpointDimensions<E>)) {
			throw new Error(
				`Dimension "${dimension}" is not supported by endpoint "${request.endpoint}".`
			)
		}
	})
}

const buildSearchParams = (fields: string, params: WindsorRequestParams = {}): URLSearchParams => {
	const searchParams = new URLSearchParams()
	const apiKey = ensureApiKey()
	searchParams.set('api_key', apiKey)
	searchParams.set('fields', fields)

	WINDSOR_FILTER_KEYS.forEach(key => {
		const value = params?.[key]
		if (value === undefined || value === null) {
			return
		}

		if (key === 'filter') {
			searchParams.set(key, JSON.stringify(value))
			return
		}

		if (Array.isArray(value)) {
			searchParams.set(key, value.join(','))
			return
		}

		searchParams.set(key, String(value))
	})

	return searchParams
}

const ensureFetch = (): typeof fetch => {
	if (typeof fetch === 'undefined') {
		throw new Error(
			'Global fetch is not available. Please upgrade to Node 18+ or polyfill fetch.'
		)
	}
	return fetch
}

export async function windsorRequest<E extends WindsorEndpoint>(
	request: WindsorRequest<E>
): Promise<WindsorResponse<E>> {
	validateRequest(request)

	console.log('Windsor request', request)

	const catalog = windsorEndpoints[request.endpoint]
	const connector = request.connector ?? catalog.connector
	const url = `${WINDSOR_API_BASE}/${connector}`
	const resolvedParams: WindsorRequestParams = {
		...(request.params ?? {})
	}

	if (
		catalog.defaultDatePreset &&
		!resolvedParams.date_from &&
		!resolvedParams.date_to &&
		!resolvedParams.date_preset
	) {
		resolvedParams.date_preset = catalog.defaultDatePreset
	}

	const fields = buildFieldsString(request.metrics, request.dimensions)
	const params = buildSearchParams(fields, resolvedParams)
	const runtimeFetch = ensureFetch()

	console.log('Windsor request URL', `${url}?${params.toString()}`)

	const response = await runtimeFetch(`${url}?${params.toString()}`)

	if (!response.ok) {
		throw new Error(
			`Windsor request failed with status ${response.status}: ${await response.text()}`
		)
	}

	return (await response.json()) as WindsorResponse<E>
}

export const windsor = {
	endpoints: windsorEndpoints,
	request: windsorRequest
}
