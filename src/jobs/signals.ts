import { defineSignal } from '../shared/data/types'

export const wastedSpendKeyword = defineSignal({
	id: 'wastedSpendKeyword',
	kind: 'opportunity',
	signalType: 'deterministic',

	// What silver entity tables to extract the necessary data from
	targets: [
		{
			entity: 'keywordDaily',
			scope: 'keyword_text'
		}
	],

	// WHEN it’s allowed to run
	applicability: {
		minWindowDays: 30,
		supportsCustomDateRange: true, // can run on any 30d+ span
		supportsFilteredAccounts: false, // no account_id in this shape
		requiresFullAccountContext: false,
		supportedModes: ['single', 'breakdown'] // not a comparison-only signal
	},

	// HOW to decide if a row is a signal (on whatever slice you give it)
	predicate: {
		mode: 'expression',
		expression: 'spend > 0 && conversions == 0'
	},

	// How a single row becomes a Signal instance
	output: {
		keyFields: ['campaign_id', 'ad_group_id', 'keyword_text', 'date'], // dedupe/id
		impact: {
			formula: 'spend',
			unit: 'currency',
			direction: 'positive_if_fixed' // fixing saves money
		},
		confidence: {
			mode: 'fixed',
			value: 1.0
		}
	},

	snapshot: {
		enabled: true,

		cadence: 'daily', // 'daily' | 'weekly' | 'monthly' | 'onRun'
		windowId: 'last_90d', // reference to a standard window, or derived from view

		// How we group snapshots
		attributionKey: ['account_id', 'keyword_text'],
		// or e.g. ['account_id', 'country'], ['account_id', 'gender']

		// Which metrics to store and summarize
		metrics: {
			totalImpact: {
				field: 'impact',
				aggregate: 'sum'
			}, // e.g. current wasted spend
			itemCount: {
				field: '*',
				aggregate: 'count'
			} // how many instances
		},

		// Whether we track changes over time
		trackDelta: true // engine will compute delta vs previous snapshot
	},

	// How to show & explain it
	presentation: {
		titleTemplate: 'Wasted spend on "{{keyword_text}}"',
		summaryTemplate:
			'You spent {{spend|currency}} on keyword "{{keyword_text}}" in {{campaign_name}} with 0 conversions.',
		tags: ['google_ads', 'waste', 'negative_keyword'],

		// optional LLM helpers
		llmExplainPrompt: `
      You are a PPC strategist. Explain in plain language why the following
      keyword is considered wasted spend and suggest concrete actions.
      {{row_json}}
    `,
		suggestedUserPrompts: [
			'Group these wasted keywords into themes.',
			'Suggest negative keyword lists from these rows.'
		]
	}
})

export const signals = { wastedSpendKeyword }
