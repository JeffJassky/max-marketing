import { Agent } from 'undici'

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

/** Windsor request timeout in milliseconds */
const WINDSOR_REQUEST_TIMEOUT_MS = 600000 // 10 minutes

/** Custom fetch agent with extended timeouts for slow Windsor responses */
const windsorAgent = new Agent({
	headersTimeout: WINDSOR_REQUEST_TIMEOUT_MS,
	bodyTimeout: WINDSOR_REQUEST_TIMEOUT_MS,
})

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
	// validateRequest(request) -- Validation disabled to allow arbitrary endpoints/fields

	console.log('Windsor request', request)

	const catalog = windsorEndpoints[request.endpoint]
	const connector = request.connector ?? catalog?.connector
	
	if (!connector) {
		throw new Error(`Connector not specified for endpoint "${request.endpoint}" and no catalog entry found.`)
	}

	const url = `${WINDSOR_API_BASE}/${connector}`
	const resolvedParams: WindsorRequestParams = {
		...(request.params ?? {})
	}

	if (
		catalog?.defaultDatePreset &&
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

	// Add timeout to prevent hanging - Windsor can be slow
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), WINDSOR_REQUEST_TIMEOUT_MS)

	let response: Response
	try {
		response = await runtimeFetch(`${url}?${params.toString()}`, {
			signal: controller.signal,
			// @ts-expect-error - dispatcher is a valid undici option for Node's native fetch
			dispatcher: windsorAgent,
		})
	} catch (fetchError: any) {
		clearTimeout(timeoutId)
		const timeoutMinutes = WINDSOR_REQUEST_TIMEOUT_MS / 60000
		if (fetchError.name === 'AbortError') {
			throw new Error(`Windsor request timed out after ${timeoutMinutes} minutes. Adjust WINDSOR_REQUEST_TIMEOUT_MS in windsor.ts if needed.`)
		}
		// Check for undici timeout errors (headers or body timeout)
		if (fetchError.cause?.code === 'UND_ERR_HEADERS_TIMEOUT' || fetchError.cause?.code === 'UND_ERR_BODY_TIMEOUT') {
			throw new Error(`Windsor request timed out after ${timeoutMinutes} minutes (${fetchError.cause.code}). Adjust WINDSOR_REQUEST_TIMEOUT_MS in windsor.ts if needed.`)
		}
		// Log more details about the fetch error
		console.error('Windsor fetch error details:', {
			name: fetchError.name,
			message: fetchError.message,
			cause: fetchError.cause,
		})
		throw fetchError
	}
	clearTimeout(timeoutId)

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
