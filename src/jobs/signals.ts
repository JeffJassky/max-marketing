import { defineSignal } from "../shared/data/types";

// Only treat keywords as wasted when the bidding strategy is conversion-focused.
const CONVERSION_FOCUSED_STRATEGIES = [
  "TARGET_CPA",
  "TARGET_ROAS",
  "MAXIMIZE_CONVERSIONS",
  "MAXIMIZE_CONVERSION_VALUE",
];

const CLICK_FOCUSED_STRATEGIES = ["TARGET_SPEND", "MANUAL_CPC"];

const goalCaseExpression = `
  CASE
    WHEN bidding_strategy_type IN (${CONVERSION_FOCUSED_STRATEGIES.map((strategy) => `'${strategy}'`).join(
      ", "
    )}) THEN 'conversions'
    WHEN bidding_strategy_type IN (${CLICK_FOCUSED_STRATEGIES.map((strategy) => `'${strategy}'`).join(
      ", "
    )}) THEN 'clicks'
    ELSE NULL
  END
`;

const conversionStrategyPredicate = CONVERSION_FOCUSED_STRATEGIES.map(
  (strategy) => `bidding_strategy_type == "${strategy}"`
).join(" || ");

const clickStrategyPredicate = CLICK_FOCUSED_STRATEGIES.map(
  (strategy) => `bidding_strategy_type == "${strategy}"`
).join(" || ");

export const wastedSpendKeyword = defineSignal({
  id: "wastedSpendKeyword",
  kind: "opportunity",
  signalType: "deterministic",

  // What silver entity tables to extract the necessary data from
  targets: [
    {
      entity: "keywordDaily",
      scope: "keyword_text",
    },
  ],

  // WHEN it’s allowed to run
  applicability: {
    minWindowDays: 30,
    supportsCustomDateRange: true, // can run on any 30d+ span
    supportsFilteredAccounts: true, // account_id now available
    requiresFullAccountContext: false,
    supportedModes: ["single", "breakdown"], // not a comparison-only signal
  },

  // HOW to decide if a row is a signal (on whatever slice you give it)
  predicate: {
    mode: "expression",
    expression: `spend > 0 && (((${conversionStrategyPredicate}) && conversions == 0) || ((${clickStrategyPredicate}) && clicks == 0))`,
  },

  // How a single row becomes a Signal instance
  output: {
    keyFields: [
      "account_id",
      "campaign_id",
      "keyword_text",
      "bidding_strategy_type",
    ], // dedupe/id at rollup level (cross-campaign)
    impact: {
      formula: "spend", // aggregated spend from snapshot metrics
      unit: "currency",
      direction: "positive_if_fixed", // fixing saves money
    },
    confidence: {
      mode: "fixed",
      value: 1.0,
    },
  },

  snapshot: {
    enabled: true,

    cadence: "daily", // 'daily' | 'weekly' | 'monthly' | 'onRun'
    windowId: "last_90d", // aggregate over the most recent 90d

    // How we group snapshots
    attributionKey: [
      "account_id",
      "campaign_id",
      "keyword_text",
      "bidding_strategy_type",
    ],
    // or e.g. ['account_id', 'country'], ['account_id', 'gender']

    // Which metrics to store and summarize
    metrics: {
      spend: { field: "spend", aggregate: "sum" },
      clicks: { field: "clicks", aggregate: "sum" },
      impressions: { field: "impressions", aggregate: "sum" },
      conversions: { field: "conversions", aggregate: "sum" },
      conversions_value: { field: "conversions_value", aggregate: "sum" },
      goal: { field: goalCaseExpression, aggregate: "max" },
      keyword_match_type: { field: "keyword_match_type", aggregate: "max" },
      campaign: { field: "campaign_name", aggregate: "max" },
      last_seen: { field: "date", aggregate: "max" },
    },

    // Whether we track changes over time
    trackDelta: true, // engine will compute delta vs previous snapshot
  },

  // How to show & explain it
  presentation: {
    titleTemplate: 'Wasted spend on "{{keyword_text}}"',
    summaryTemplate:
      'You spent {{spend|currency}} on keyword "{{keyword_text}}" pursuing {{goal}} but saw no results over the last 30 days.',
    tags: ["google_ads", "waste", "negative_keyword"],

    // optional LLM helpers
    llmExplainPrompt: `
      You are a PPC strategist. Explain in plain language why the following
      keyword is considered wasted spend and suggest concrete actions.
      {{row_json}}
    `,
    suggestedUserPrompts: [
      "Group these wasted keywords into themes.",
      "Suggest negative keyword lists from these rows.",
    ],
  },
});

export const signals = { wastedSpendKeyword };
