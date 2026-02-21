# Question & Answer System — Final Plan

## Executive Summary

This document defines the architecture for a guided Q&A system that helps marketers understand their data without needing to know what to ask. The system presents dynamically-selected **Questions** that serve as conversation starters, each backed by pre-determined data sources that ensure accurate, defensible answers.

**Core insight**: Chat fails when users don't know what to ask. We solve this by controlling the entry points — surfacing the right questions at the right time, backed by data we've already computed.

**Key architectural decision**: Questions are returned **alongside the data from each API endpoint**, allowing the GUI to display them contextually on each page. The homepage aggregates questions to fill 8 balanced slots across categories.

---

## Terminology

We use **Questions** (not "Cards" or "Insights") because:
- They're conversation starters, not static displays
- Each has a pre-determined answer pathway
- The paradigm is Q&A, not dashboard widgets

| Term | Definition |
|------|------------|
| **Question** | A user-facing prompt with pre-defined data sources |
| **Question Library** | Central registry of all question definitions |
| **Answer** | LLM-synthesized response from pre-fetched data |
| **Follow-up** | Suggested next questions to continue the conversation |
| **Max Account** | A user's account in the system, with connections to various platforms (Google Ads, Meta, Shopify, etc.) — all questions are scoped to a single Max Account |

---

## Data Sources

Questions are answered by composing data from existing shapes in the system:

| Source Type | What It Provides | Example |
|-------------|------------------|---------|
| **Entities** | Raw/aggregated metrics at any grain | `shopifyDaily` revenue WoW comparison |
| **Superlatives** | Top performers + trend awards | Top 5 campaigns by ROAS with RocketShip award |
| **Monitors** | Anomalies when thresholds are crossed | Creative fatigue detected (CTR down 30%) |
| **Aggregate Reports** | Pre-computed insights with predicates | Wasted spend report |
| **User Settings** | Targets, budgets, goals | Monthly budget of $10,000 |

Questions declare which sources they need. The system fetches the data, then the LLM synthesizes the answer.

---

## Question Definition Schema

```typescript
interface QuestionDefinition {
  // ─── Identity ───────────────────────────────────────────────────────
  id: string;                           // Unique identifier
  text: string;                         // User-facing question text

  // ─── Classification ─────────────────────────────────────────────────
  category: 'momentum' | 'opportunity' | 'guardrail' | 'narrative';
  timeframe: 'now' | 'next';

  // ─── Data Sources ───────────────────────────────────────────────────
  sources: {
    entities?: EntityQueryDef[];        // Direct entity queries
    superlatives?: string[];            // Superlative references (entity.dimension.metric)
    monitors?: string[];                // Monitor IDs
    aggregateReports?: string[];        // Aggregate report IDs
    userSettings?: string[];            // Setting keys (e.g., "monthlyBudget")
  };

  // ─── Selection Logic ────────────────────────────────────────────────
  relevance: RelevanceCondition[];      // When should this question appear?
  confidenceThreshold: number;          // Minimum confidence to show (0-1)
  priority?: number;                    // Tiebreaker when multiple questions qualify

  // ─── Answer Generation ──────────────────────────────────────────────
  answerHints?: string;                 // Optional guidance for LLM synthesis
  followUps?: string[];                 // Suggested follow-up question IDs
}

interface EntityQueryDef {
  id: string;                           // Entity ID (e.g., "shopifyDaily")
  metric: string;                       // Metric to fetch (e.g., "revenue")
  comparison?: 'WoW' | 'MoM' | 'YoY' | 'MTD' | 'QTD';
  dimensions?: string[];                // Group by dimensions
  filters?: FilterDef[];                // Additional filters
}

interface RelevanceCondition {
  source: string;                       // Data source to check
  field: string;                        // Field/metric to evaluate
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'exists' | 'not_exists';
  value?: number | string | boolean;
  comparison?: 'WoW' | 'MoM';           // For delta comparisons
}
```

---

## The 8-Slot System

Exactly **8 questions** are always shown, distributed as:

| Category | Slots | Now | Next |
|----------|-------|-----|------|
| **Momentum** (wins, learning) | 2 | 1 | 1 |
| **Opportunity** (improvement potential) | 2 | 1 | 1 |
| **Guardrail** (protection, risk) | 2 | 1 | 1 |
| **Narrative** (executive framing) | 2 | 1 | 1 |

### Selection Algorithm

```
For each (category, timeframe) pair:
  1. Filter question library to matching category + timeframe
  2. Evaluate relevance conditions for each question
  3. Filter to questions meeting confidence threshold
  4. Sort by priority (descending)
  5. Select top question for this slot

If no question qualifies for a slot:
  - Fall back to a safe/generic question for that category
  - Or show an exploratory prompt (clearly framed as such)
```

### Constraints

- **Language rule**: Only Narrative questions use owner/executive language. All others use marketer/operator language.
- **Negativity balance**: The distribution ensures wins are always shown alongside risks.
- **No speculation**: If confidence is too low, reframe as learning or omit.

---

## Category Definitions

### Momentum (wins, learning)
Questions that highlight what's working and worth celebrating.

**Now examples:**
- "What drove the revenue lift this week?"
- "Which campaign is outperforming right now?"

**Next examples:**
- "What should we repeat based on recent wins?"
- "What's gaining momentum that we should lean into?"

### Opportunity (improvement potential)
Questions that surface areas for optimization without being negative.

**Now examples:**
- "Where could performance improve with refreshed creative?"
- "Which audiences are underperforming their potential?"

**Next examples:**
- "Where should we test next based on recent trends?"
- "What's one change that could unlock growth?"

### Guardrail (protection, risk)
Questions that protect performance and catch problems early.

**Now examples:**
- "Is spend pacing ahead of plan?"
- "Are any campaigns showing signs of fatigue?"

**Next examples:**
- "Why are some channels becoming less efficient?"
- "What should we monitor closely this week?"

### Narrative (executive framing)
Questions designed for reporting up to leadership.

**Now examples:**
- "What would I tell my boss about performance so far?"
- "How are we tracking against our goals?"

**Next examples:**
- "What's the story of this month so far?"
- "What should leadership know about next quarter?"

---

## Example Question Definitions

```typescript
export const questionLibrary: QuestionDefinition[] = [
  // ─── Momentum ───────────────────────────────────────────────────────
  {
    id: "revenue_driver",
    text: "What drove the revenue lift this week?",
    category: "momentum",
    timeframe: "now",
    sources: {
      entities: [
        { id: "shopifyDaily", metric: "revenue", comparison: "WoW" }
      ],
      superlatives: [
        "adsDaily.campaign.conversions_value",
        "adsDaily.channel_group.conversions_value"
      ],
    },
    relevance: [
      { source: "shopifyDaily", field: "revenue", operator: ">", value: 0.05, comparison: "WoW" }
    ],
    confidenceThreshold: 0.7,
    followUps: ["repeat_winners", "channel_efficiency"],
  },

  {
    id: "repeat_winners",
    text: "What should we repeat based on recent wins?",
    category: "momentum",
    timeframe: "next",
    sources: {
      superlatives: [
        "adsDaily.campaign.roas",
        "adsDaily.campaign.conversions",
        "creativeDaily.creative.roas"
      ],
    },
    relevance: [
      { source: "superlatives", field: "awards", operator: "exists" }
    ],
    confidenceThreshold: 0.6,
    answerHints: "Focus on campaigns/creatives with RocketShip or SteadyClimber awards",
  },

  // ─── Opportunity ────────────────────────────────────────────────────
  {
    id: "creative_refresh",
    text: "Where could performance improve with refreshed creative?",
    category: "opportunity",
    timeframe: "now",
    sources: {
      monitors: ["creative_fatigue_monitor"],
    },
    relevance: [
      { source: "creative_fatigue_monitor", field: "anomaly_count", operator: ">", value: 0 }
    ],
    confidenceThreshold: 0.8,
    followUps: ["top_creatives", "creative_trends"],
  },

  {
    id: "test_opportunities",
    text: "Where should we test next based on recent trends?",
    category: "opportunity",
    timeframe: "next",
    sources: {
      superlatives: [
        "adsDaily.campaign.conversions",
        "keywordDaily.keyword.conversions"
      ],
      monitors: ["broad_match_drift_monitor"],
    },
    relevance: [
      { source: "superlatives", field: "emerging_performers", operator: "exists" }
    ],
    confidenceThreshold: 0.5,
    answerHints: "Look for RocketShip awards on smaller entities - signals emerging opportunity",
  },

  // ─── Guardrail ──────────────────────────────────────────────────────
  {
    id: "spend_pacing",
    text: "Is spend pacing ahead of plan?",
    category: "guardrail",
    timeframe: "now",
    sources: {
      entities: [
        { id: "adsDaily", metric: "spend", comparison: "MTD" }
      ],
      userSettings: ["monthlyBudget"],
    },
    relevance: [
      { source: "userSettings", field: "monthlyBudget", operator: "exists" }
    ],
    confidenceThreshold: 0.9,
    followUps: ["spend_breakdown", "budget_reallocation"],
  },

  {
    id: "channel_efficiency_decline",
    text: "Why are some channels becoming less efficient?",
    category: "guardrail",
    timeframe: "next",
    sources: {
      entities: [
        { id: "adsDaily", metric: "roas", comparison: "WoW", dimensions: ["platform"] }
      ],
      superlatives: ["adsDaily.platform.cpa"],
    },
    relevance: [
      { source: "adsDaily", field: "roas", operator: "<", value: -0.1, comparison: "WoW" }
    ],
    confidenceThreshold: 0.7,
  },

  // ─── Narrative ──────────────────────────────────────────────────────
  {
    id: "boss_summary",
    text: "What would I tell my boss about performance so far?",
    category: "narrative",
    timeframe: "now",
    sources: {
      entities: [
        { id: "shopifyDaily", metric: "revenue", comparison: "MTD" },
        { id: "adsDaily", metric: "spend", comparison: "MTD" },
        { id: "adsDaily", metric: "roas", comparison: "MTD" }
      ],
      superlatives: [
        "adsDaily.campaign.conversions_value",
        "shopifyDaily.source.revenue"
      ],
      monitors: ["shopify_revenue_drop_monitor", "account_spend_anomaly_monitor"],
    },
    relevance: [], // Always relevant
    confidenceThreshold: 0.6,
    answerHints: "Frame positively but honestly. Lead with wins, acknowledge challenges, end with outlook.",
    followUps: ["goal_pacing", "next_steps"],
  },

  {
    id: "month_story",
    text: "What's the story of this month so far?",
    category: "narrative",
    timeframe: "next",
    sources: {
      entities: [
        { id: "shopifyDaily", metric: "revenue", comparison: "MTD" },
        { id: "shopifyDaily", metric: "orders", comparison: "MTD" }
      ],
      superlatives: [
        "adsDaily.campaign.conversions_value",
        "creativeDaily.creative.roas"
      ],
      userSettings: ["monthlyRevenueTarget"],
    },
    relevance: [],
    confidenceThreshold: 0.5,
    answerHints: "Create a narrative arc: where we started, what happened, where we're heading",
  },
];
```

---

## Answer Generation Flow

When a user clicks a question:

```
1. FETCH DATA
   ├── Query each declared entity source
   ├── Fetch relevant superlatives
   ├── Fetch anomalies from declared monitors
   ├── Load user settings
   └── Aggregate into a context object

2. SYNTHESIZE ANSWER
   ├── Pass context + question + answerHints to LLM
   ├── LLM generates structured response:
   │   ├── Conclusion (1-2 sentences, direct answer)
   │   ├── Supporting drivers (2-4 bullet points with evidence)
   │   └── Suggested actions (1-3 next steps)
   └── Validate confidence meets threshold

3. PRESENT RESPONSE
   ├── Show conclusion prominently
   ├── Show supporting evidence
   ├── Show suggested actions
   └── Offer follow-up questions (from followUps array)

4. ENABLE DRILL-DOWN
   └── User can click follow-ups or type custom questions
       (Chat continues with full context)
```

### Answer Structure

```typescript
interface QuestionAnswer {
  questionId: string;
  conclusion: string;                    // Direct answer (1-2 sentences)
  drivers: {
    point: string;
    evidence: string;
    metric?: { label: string; value: string; delta?: string };
  }[];
  suggestedActions: string[];
  followUpQuestions: { id: string; text: string }[];
  confidence: number;
  generatedAt: string;
}
```

---

## Relevance & Confidence

### Relevance Conditions

Questions only appear when their relevance conditions are met:

```typescript
// Only show "revenue driver" when revenue actually increased
relevance: [
  { source: "shopifyDaily", field: "revenue", operator: ">", value: 0.05, comparison: "WoW" }
]

// Only show "spend pacing" when user has set a budget
relevance: [
  { source: "userSettings", field: "monthlyBudget", operator: "exists" }
]

// Only show "creative refresh" when fatigue is detected
relevance: [
  { source: "creative_fatigue_monitor", field: "anomaly_count", operator: ">", value: 0 }
]
```

### Confidence Thresholds

Different question types require different confidence levels:

| Category | Typical Threshold | Rationale |
|----------|-------------------|-----------|
| Guardrail | 0.8 - 0.9 | High stakes, need certainty |
| Momentum | 0.6 - 0.7 | Celebrating wins, some tolerance |
| Opportunity | 0.5 - 0.7 | Exploratory by nature |
| Narrative | 0.5 - 0.6 | Synthesis, more subjective |

---

## Fallback Behavior

When a slot can't be filled (no question meets relevance + confidence):

1. **Try lower-priority questions** in same category/timeframe
2. **Fall back to generic questions**:
   - Momentum: "What's been working well recently?"
   - Opportunity: "Where might there be room to improve?"
   - Guardrail: "Is there anything we should keep an eye on?"
   - Narrative: "How would you summarize recent performance?"
3. **Mark as exploratory** if using speculative question:
   - "We don't have strong signals, but this might be worth exploring..."

---

## API Integration Pattern

Questions are returned **alongside the data they're based on** from each API endpoint. This allows the GUI to display questions contextually on the pages where they're most relevant.

### How It Works

Each data endpoint evaluates which questions are relevant based on the data it returns:

```
GET /api/superlatives?accountId=xxx

Response:
{
  superlatives: [...],              // The actual data
  questions: [                       // Questions relevant to this data
    { id: "repeat_winners", text: "What should we repeat based on recent wins?", ... },
    { id: "top_performer", text: "Why is this campaign outperforming?", ... }
  ]
}
```

```
GET /api/monitors/anomalies?accountId=xxx

Response:
{
  anomalies: [...],
  questions: [
    { id: "creative_refresh", text: "Where could performance improve with refreshed creative?", ... }
  ]
}
```

### Endpoint → Question Mapping

| Endpoint | Returns Questions Using |
|----------|------------------------|
| `/api/superlatives` | `sources.superlatives` |
| `/api/monitors/anomalies` | `sources.monitors` |
| `/api/entities/{entityId}` | `sources.entities` matching entityId |
| `/api/aggregate-reports` | `sources.aggregateReports` |

### Question Selection Per Endpoint

```typescript
function getQuestionsForEndpoint(
  endpointType: 'superlatives' | 'monitors' | 'entities' | 'aggregateReports',
  data: any,
  accountId: string
): QuestionDefinition[] {

  // 1. Filter library to questions that use this source type
  const candidates = questionLibrary.filter(q => {
    if (endpointType === 'superlatives') return q.sources.superlatives?.length > 0;
    if (endpointType === 'monitors') return q.sources.monitors?.length > 0;
    // ... etc
  });

  // 2. Evaluate relevance conditions against the actual data
  const relevant = candidates.filter(q =>
    evaluateRelevance(q.relevance, data)
  );

  // 3. Return questions (no limit per endpoint - GUI decides how many to show)
  return relevant;
}
```

### The 8-Slot Homepage

The homepage aggregates questions from multiple endpoints to fill its 8 slots:

```typescript
async function getHomepageQuestions(accountId: string): Promise<QuestionDefinition[]> {
  // Fetch data from all endpoints (in parallel)
  const [superlatives, anomalies, entityData, settings] = await Promise.all([
    fetchSuperlatives(accountId),
    fetchAnomalies(accountId),
    fetchEntitySummaries(accountId),
    fetchUserSettings(accountId),
  ]);

  // Evaluate all questions against all data
  const allRelevant = questionLibrary.filter(q =>
    evaluateRelevance(q.relevance, { superlatives, anomalies, entityData, settings })
  );

  // Apply 8-slot selection algorithm
  return selectEightSlots(allRelevant);
}
```

---

## Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Refresh cadence** | Dynamic, on each API call | Questions always reflect current data state |
| **Personalization** | None | Keep it simple; selection based purely on data relevance |
| **Caching** | None for now | Simplicity first; can add as optimization later |
| **Account scope** | Single Max Account | Each API call is scoped to one account |

### Future Optimization: Caching

Some data (superlatives) is pre-computed monthly. When caching is added:
- Cache question evaluations alongside cached data
- Invalidate when underlying data refreshes
- Consider pre-computing "likely questions" during data pipeline runs

---

## Implementation Phases

### Phase 1: Core Infrastructure ✅ COMPLETE
- [x] Define `QuestionDefinition` type in codebase (`src/shared/data/questions/types.ts`)
- [x] Create question library with 16 initial questions (`src/shared/data/questions/library.ts`)
- [x] Build `getQuestionsForSource()` helper to filter library by source type
- [x] Build `evaluateRelevance()` function to check conditions against data (`src/shared/data/questions/evaluator.ts`)

### Phase 2: API Integration ✅ COMPLETE
- [x] Modify superlatives endpoint to return relevant questions (`/api/reports/superlatives`)
- [x] Modify monitors/anomalies endpoint to return relevant questions (`/api/monitors/anomalies`)
- [x] Create homepage endpoint that aggregates and applies 8-slot selection (`/api/questions/homepage`)
- [x] Create question detail endpoint (`/api/questions/:questionId`)

### Phase 3: Answer Generation
- [ ] Create answer synthesis prompt for LLM
- [ ] Build answer structure/formatting
- [ ] Implement follow-up question flow
- [ ] Connect question click → answer generation → chat continuation

### Phase 4: UI Integration ✅ PARTIAL
- [x] Build `QuestionsPanel` component (`src/client/src/components/QuestionsPanel.vue`)
- [x] Display questions on superlatives page (SuperlativesView.vue)
- [x] Display questions on monitors/anomalies page (MonitorsView.vue)
- [x] Display 8-slot questions on homepage/dashboard (DashboardView.vue)
- [ ] Build answer display component
- [ ] Connect question click → chat continuation

### Phase 5: Refinement
- [ ] Tune relevance conditions based on real data
- [ ] Adjust confidence thresholds
- [ ] Add more questions to library
- [ ] (Future) Add caching layer for performance

---

## Success Metrics

The system is working if:

- Users click questions (engagement)
- Users report answers as helpful (satisfaction)
- Users return to check "what changed" (retention)
- Users share answers with leadership (value demonstration)
- Chat usage increases via follow-ups (discovery)

---

## Summary

This system transforms "chat with your data" from an open-ended (and often frustrating) experience into a guided discovery process. By:

1. **Controlling entry points** — we surface the right questions
2. **Pre-determining data sources** — answers are fast and accurate
3. **Embedding questions in data endpoints** — questions appear where they're most relevant
4. **Balancing categories on homepage** — users see wins, opportunities, and risks
5. **Enabling drill-down** — chat becomes a continuation, not a starting point

**Architecture principles**:
- Questions scoped to single Max Account
- Evaluated fresh on each API call (no stale suggestions)
- No personalization or learning (data-driven selection only)
- Caching deferred to future optimization phase

The result: marketers feel calm, informed, and slightly smarter than they expected.
