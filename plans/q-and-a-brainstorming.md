# Question & Answer System: Technical Design

This document outlines a grounded technical approach for the "Momentum Cards" feature based on existing system capabilities.

---

## 1. The Core Problem

The concept doc (`question-and-answer-plan.md`) nails the *why*. This document focuses on the *how*.

**Key insight**: We have rich data pipelines. The challenge is surfacing the *right* questions from them.

### Approach: Template-Based Cards from Definitions

All cards are **anchored** — template-based, triggered by specific signals, defined at the source.

No AI-generated "discovered" cards. This keeps the system:
- **Predictable**: Users know what to expect
- **Fast**: No LLM latency
- **Debuggable**: Easy to trace why a card appeared
- **Reliable**: No hallucination risk

---

## 1b. Key Constraints

### Not All Accounts Have All Data

Accounts vary widely:
- Some have Google Ads only
- Some have Shopify + Meta but no GA4
- Some have GSC, others don't

The system must be **data-aware**: only show cards when required data exists.

### Requires Syntax

Consistent syntax across all definitions:

```typescript
requires: {
  all: ['shopify'],              // Must have all of these
  any: ['googleAds', 'metaAds']  // Must have at least one of these
}

// Examples:
requires: { all: [], any: [] }                        // Always available
requires: { all: ['shopify'], any: [] }               // Needs Shopify
requires: { all: [], any: ['googleAds', 'metaAds'] }  // Needs Google OR Meta
requires: { all: ['shopify'], any: ['googleAds', 'metaAds'] }  // Needs Shopify AND (Google OR Meta)
```

### Not All Signals Are Equal

Being #1 in "impressions" is less meaningful than #1 in "ROAS".

Rather than separate weighting functions, **add `weight: number` to existing definitions**. Scoring reads directly from definitions.

---

## 2. Centralized Definitions

Everything in one place: `weight`, `card` template, and `requires`.

### Monitors

```typescript
// src/jobs/entities/ads-daily/monitors/account-spend-anomaly.monitor.ts
export const accountSpendAnomalyMonitor = new Monitor({
  id: "account_spend_anomaly_monitor",
  weight: 90,
  requires: { all: [], any: ['googleAds', 'metaAds'] },
  card: {
    type: 'guardrail',
    timing: 'now',
    question: "Spend is {{direction}} {{pct}}%—is this intentional?",
    subtitle: "{{platform}} spend {{direction}} vs. 30-day average",
  },
  // ... existing monitor config
});
```

### Awards

```typescript
// src/shared/data/awards/library.ts
export const RocketShipAward: AwardDefinition = {
  id: 'rocket-ship',
  label: 'Rocket Ship',
  icon: '🚀',
  weight: 25,
  card: {
    type: 'momentum',
    timing: 'now',
    question: "Why did {{item_name}} surge in rankings?",
    subtitle: "Jumped {{rank_delta}} spots to #{{position}}",
  },
  evaluate: ({ currentItem, previousItem }) => {
    if (!previousItem) return false;
    return previousItem.position - currentItem.position >= 3;
  }
};

// Some awards might not need cards (informational only)
export const PodiumAward: AwardDefinition = {
  id: 'podium',
  label: 'Podium Finish',
  icon: '🏆',
  weight: 5,
  // No card - this award doesn't trigger a question on its own
  evaluate: ({ currentItem }) => currentItem.position <= 3 && currentItem.position > 1
};
```

### Metrics (in Entity Definitions)

```typescript
// src/jobs/entities/ads-daily/ads-daily.entity.ts
metrics: {
  conversions_value: {
    type: z.number(),
    aggregation: "sum",
    weight: 100,
    card: {
      type: 'momentum',
      timing: 'now',
      question: "What's driving {{item_name}}'s revenue performance?",
      subtitle: "{{metric_value}} in conversions value this period",
    }
  },
  impressions: {
    type: z.number(),
    aggregation: "sum",
    weight: 20,
    // No card - low-weight metrics don't need dedicated questions
  },
}
```

### Superlative Dimensions

```typescript
// src/jobs/entities/ads-daily/ads-daily.entity.ts
superlatives: [{
  dimensionId: "campaign_id",
  dimensionNameField: "campaign_name",
  dimensionLabel: "Campaign",
  weight: 80,
  card: {
    type: 'momentum',
    timing: 'now',
    question: "What's working in {{item_name}}?",
    subtitle: "Top campaign by {{metric_name}}",
  },
  metrics: [...]
}]
```

### Executive Metrics

```typescript
// src/shared/data/executiveMetrics.ts
export const executiveMetrics: ExecutiveMetricDef[] = [
  {
    id: 'mer',
    label: 'Marketing Efficiency Ratio',
    weight: 85,
    formula: 'shopify.revenue / (googleAds.spend + metaAds.spend)',
    requires: { all: ['shopify'], any: ['googleAds', 'metaAds'] },
    threshold: { changePercent: 10 },
    card: {
      type: 'executive',
      timing: 'now',
      question: "MER is {{direction}} {{change}}%—what's driving it?",
      subtitle: "Currently {{value}}x (was {{previous}}x)",
    }
  },
  {
    id: 'tcac',
    label: 'True Customer Acquisition Cost',
    weight: 80,
    formula: '(googleAds.spend + metaAds.spend) / shopify.newCustomers',
    requires: { all: ['shopify'], any: ['googleAds', 'metaAds'] },
    threshold: { changePercent: 15 },
    card: {
      type: 'executive',
      timing: 'now',
      question: "tCAC {{direction}} to ${{value}}—sustainable?",
      subtitle: "{{change}}% vs last period",
    }
  },
  {
    id: 'acquisition_mix',
    label: 'New Customer Revenue %',
    weight: 60,
    formula: 'shopify.newCustomerRevenue / shopify.revenue',
    requires: { all: ['shopify'], any: [] },
    threshold: { changePercent: 5 },
    card: {
      type: 'executive',
      timing: 'next',
      question: "{{value}}% of revenue from new customers—healthy mix?",
      subtitle: "{{direction}} {{change}}% vs last period",
    }
  },
];
```

### Learning Cards (Defined on Entities/Reports)

Instead of a separate pool, learning cards are defined where relevant:

```typescript
// src/jobs/entities/ads-daily/ads-daily.entity.ts
export const adsDaily = new Entity({
  id: "adsDaily",
  // ... existing config

  learningCards: [
    {
      id: 'ads-spend-breakdown',
      weight: 30,
      requires: { all: [], any: ['googleAds', 'metaAds'] },
      card: {
        type: 'executive',
        timing: 'now',
        question: "What's the current spend breakdown by platform?",
        subtitle: "Understand budget allocation",
      }
    },
    {
      id: 'ads-performance-trend',
      weight: 25,
      requires: { all: [], any: ['googleAds', 'metaAds'] },
      card: {
        type: 'momentum',
        timing: 'next',
        question: "How does ad performance compare to last month?",
        subtitle: "See trends across campaigns",
      }
    }
  ]
});

// src/jobs/entities/shopify-daily/shopify-daily.entity.ts
export const shopifyDaily = new Entity({
  id: "shopifyDaily",
  // ... existing config

  learningCards: [
    {
      id: 'shopify-top-products',
      weight: 30,
      requires: { all: ['shopify'], any: [] },
      card: {
        type: 'momentum',
        timing: 'next',
        question: "Which products are driving the most revenue?",
        subtitle: "Identify top Shopify performers",
      }
    },
    {
      id: 'shopify-customer-mix',
      weight: 25,
      requires: { all: ['shopify'], any: [] },
      card: {
        type: 'executive',
        timing: 'next',
        question: "How healthy is our customer acquisition mix?",
        subtitle: "New vs returning customer revenue",
      }
    }
  ]
});

// src/jobs/entities/gsc-daily/gsc-daily.entity.ts
export const gscDaily = new Entity({
  id: "gscDaily",
  // ... existing config

  learningCards: [
    {
      id: 'gsc-ranking-trends',
      weight: 25,
      requires: { all: ['gsc'], any: [] },
      card: {
        type: 'opportunity',
        timing: 'next',
        question: "How are our organic rankings trending?",
        subtitle: "Review Search Console performance",
      }
    }
  ]
});
```

---

## 3. Architecture: Card Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                      CONTEXT BUILDER                            │
│  Builds: connectedPlatforms, anomalies, superlatives, exec      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CARD GENERATOR                             │
│  Sources: monitors, awards, metrics, dimensions, executive,     │
│           learning cards                                        │
│  For each: check requires, check threshold, render template     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CARD SCORER                                │
│  Score = definition.weight + recency bonus                      │
│  Sort by score descending                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RETURN ALL CARDS                           │
│  Frontend decides how many to display                           │
└─────────────────────────────────────────────────────────────────┘
```

No rigid 2-2-2-2 constraint. Generate all valid cards, let frontend decide presentation.

---

## 4. Card Generation Logic

```typescript
interface Card {
  id: string;
  question: string;
  subtitle: string;
  type: 'guardrail' | 'momentum' | 'opportunity' | 'executive';
  timing: 'now' | 'next';
  weight: number;
  source: 'monitor' | 'superlative' | 'executive' | 'learning';
  signal?: any;
  icon: string;
}

interface Context {
  connectedPlatforms: {
    googleAds: boolean;
    metaAds: boolean;
    shopify: boolean;
    ga4: boolean;
    gsc: boolean;
    instagram: boolean;
    facebookOrganic: boolean;
  };
  anomalies: Anomaly[];
  superlatives: Superlative[];
  executiveSummary: Record<string, MetricValue>;
}

function generateCards(context: Context, registry: Registry): Card[] {
  const cards: Card[] = [];

  // 1. From active anomalies (monitors)
  for (const anomaly of context.anomalies) {
    const monitor = registry.getMonitor(anomaly.monitorId);
    if (!monitor.card) continue;
    if (!meetsRequires(monitor.requires, context.connectedPlatforms)) continue;

    cards.push({
      id: `monitor-${anomaly.id}`,
      ...monitor.card,
      question: render(monitor.card.question, anomaly.payload),
      subtitle: render(monitor.card.subtitle, anomaly.payload),
      weight: monitor.weight + recencyBonus(anomaly.detectedAt),
      source: 'monitor',
      signal: anomaly,
      icon: iconFor(monitor.card.type),
    });
  }

  // 2. From superlatives (awards > metrics > dimensions)
  for (const sup of context.superlatives) {
    const template = getSuperlativeTemplate(sup, registry);
    if (!template) continue;

    const weight = scoreSuperlative(sup, registry);

    cards.push({
      id: `superlative-${sup.item_id}-${sup.metric_name}`,
      ...template.card,
      question: render(template.card.question, sup),
      subtitle: render(template.card.subtitle, sup),
      weight: weight + recencyBonus(sup.period_start),
      source: 'superlative',
      signal: sup,
      icon: iconFor(template.card.type),
    });
  }

  // 3. From executive metrics
  for (const metric of executiveMetrics) {
    if (!meetsRequires(metric.requires, context.connectedPlatforms)) continue;

    const value = context.executiveSummary[metric.id];
    if (!value) continue;
    if (!meetsThreshold(metric.threshold, value)) continue;

    cards.push({
      id: `executive-${metric.id}`,
      ...metric.card,
      question: render(metric.card.question, value),
      subtitle: render(metric.card.subtitle, value),
      weight: metric.weight,
      source: 'executive',
      signal: value,
      icon: iconFor(metric.card.type),
    });
  }

  // 4. From learning cards (on entities)
  for (const entity of registry.allEntities) {
    for (const lc of entity.learningCards || []) {
      if (!meetsRequires(lc.requires, context.connectedPlatforms)) continue;

      cards.push({
        id: `learning-${lc.id}`,
        ...lc.card,
        weight: lc.weight,
        source: 'learning',
        icon: iconFor(lc.card.type),
      });
    }
  }

  // Sort by weight descending
  return cards.sort((a, b) => b.weight - a.weight);
}

// Helper: Get card template for superlative (priority chain)
function getSuperlativeTemplate(sup: Superlative, registry: Registry) {
  // 1. Check awards
  for (const awardId of sup.awards || []) {
    const award = registry.getAward(awardId);
    if (award?.card) return { card: award.card, weight: award.weight };
  }
  // 2. Check metric
  const metric = registry.getMetric(sup.entity_type, sup.metric_name);
  if (metric?.card) return { card: metric.card, weight: metric.weight };
  // 3. Check dimension
  const dim = registry.getSuperlativeDimension(sup.entity_type, sup.dimension);
  if (dim?.card) return { card: dim.card, weight: dim.weight };

  return null;
}

// Helper: Score superlative from definition weights
function scoreSuperlative(sup: Superlative, registry: Registry): number {
  const metricWeight = registry.getMetricWeight(sup.entity_type, sup.metric_name) ?? 20;
  const dimWeight = registry.getDimensionWeight(sup.entity_type, sup.dimension) ?? 10;
  const awardWeight = (sup.awards || [])
    .map(id => registry.getAwardWeight(id) ?? 0)
    .reduce((a, b) => a + b, 0);

  return metricWeight + dimWeight + awardWeight;
}

// Helper: Check requires
function meetsRequires(
  requires: { all: string[]; any: string[] },
  connected: Record<string, boolean>
): boolean {
  const hasAll = requires.all.every(p => connected[p]);
  const hasAny = requires.any.length === 0 || requires.any.some(p => connected[p]);
  return hasAll && hasAny;
}

// Helper: Check threshold
function meetsThreshold(
  threshold: { changePercent?: number; value?: number } | undefined,
  value: { current: number; change: number }
): boolean {
  if (!threshold) return true;
  if (threshold.changePercent && Math.abs(value.change) < threshold.changePercent) return false;
  if (threshold.value && value.current < threshold.value) return false;
  return true;
}

// Helper: Recency bonus
function recencyBonus(timestamp: string | Date): number {
  const hoursAgo = (Date.now() - new Date(timestamp).getTime()) / 3600000;
  if (hoursAgo < 24) return 15;
  if (hoursAgo < 72) return 8;
  return 0;
}
```

---

## 5. Card Click → Chat Expansion

When a card is clicked, seed the `MarketingAgent` with context:

```typescript
async function expandCard(card: Card, accountContext: Record<string, string>): Promise<string> {
  const agent = new MarketingAgent(accountContext);

  const seedPrompt = `
The user clicked this insight card: "${card.question}"

Context data:
${JSON.stringify(card.signal, null, 2)}

Please respond following this structure:
1. **Conclusion First**: State the key finding in 1-2 sentences.
2. **Supporting Evidence**: Provide 2-4 data points that back this up.
3. **Recommended Next Steps**: Suggest 1-3 specific actions they could take.
4. **Follow-up Questions**: Offer 2-3 related questions they might want to explore.

Remember:
- Use marketer language (unless this is an Executive card)
- Be specific with numbers and entity names
- Focus on actionable insights, not raw data dumps
`;

  return agent.chat([{ role: 'user', text: seedPrompt }]);
}
```

---

## 6. API Design

### GET /api/momentum/cards

Returns all valid cards, sorted by weight.

**Query Params**: `accountId`, `googleAdsId`, `facebookAdsId`, `shopifyId`, `ga4Id`, `gscId`

**Response**:
```json
{
  "cards": [
    {
      "id": "monitor-abc123",
      "type": "guardrail",
      "timing": "now",
      "source": "monitor",
      "question": "Spend is up 18%—is this intentional?",
      "subtitle": "Google Ads spend up vs. 30-day average",
      "weight": 105,
      "icon": "alert-triangle",
      "signal": { ... }
    },
    {
      "id": "superlative-camp123-roas",
      "type": "momentum",
      "timing": "now",
      "source": "superlative",
      "question": "Why did Black Friday Campaign surge in rankings?",
      "subtitle": "Jumped 4 spots to #1",
      "weight": 98,
      "icon": "trending-up",
      "signal": { ... }
    }
  ],
  "total": 12,
  "generated_at": "2026-02-02T10:00:00Z"
}
```

Frontend decides how many to show (e.g., top 8, or top 3 per type).

### POST /api/momentum/expand

Expands a card into a full chat response.

**Body**: `{ cardId: string, signal?: object }`

**Response**:
```json
{
  "response": "## Conclusion\nYour Google Ads spend spiked 18% above normal...",
  "followUpQuestions": [
    "Which campaigns drove the spend increase?",
    "How did conversions compare during this period?"
  ]
}
```

---

## 7. UI Component Structure

```
MomentumCardsSection.vue
├── props: { cards: Card[], limit?: number }
├── MomentumCard.vue × N
│   ├── CardIcon (color-coded by type)
│   ├── CardQuestion (primary text)
│   ├── CardSubtitle (data-backed secondary text)
│   └── CardBadge (optional: source indicator)
└── CardExpansionDrawer.vue (slides out on click)
    ├── ChatResponse (markdown)
    ├── FollowUpChips (clickable questions)
    └── AskMoreInput (continue conversation)
```

**Color Scheme**:
- Guardrail: `orange-500` / `AlertTriangle`
- Momentum: `green-500` / `TrendingUp`
- Opportunity: `yellow-500` / `Lightbulb`
- Executive: `blue-500` / `Briefcase`

Frontend can:
- Show top N cards overall
- Show top N per type
- Filter by type
- Hide low-weight cards below threshold

---

## 8. Implementation Phases

### Phase 1: Schema Updates
- [ ] Add `weight`, `card`, `requires` to Monitor class/schema
- [ ] Add `weight`, `card` to AwardDefinition type
- [ ] Add `weight`, `card` to entity metric definitions
- [ ] Add `weight`, `card` to superlative dimension configs
- [ ] Create `executiveMetrics.ts` with definitions
- [ ] Add `learningCards` array to entity definitions
- [ ] Update `requires` syntax everywhere to `{ all: [], any: [] }`

### Phase 2: Registry Updates
- [ ] Add `getMonitorWeight()`, `getAwardWeight()`, `getMetricWeight()`, `getDimensionWeight()`
- [ ] Add `getMonitorCard()`, `getAwardCard()`, etc.
- [ ] Add `getAllLearningCards()` that collects from all entities

### Phase 3: Card Generator (Backend)
- [ ] Create `CardGenerator` service
- [ ] Implement `generateCards(context, registry)`
- [ ] Implement `meetsRequires()` helper
- [ ] Implement `meetsThreshold()` helper
- [ ] Implement `scoreSuperlative()` helper
- [ ] Implement `recencyBonus()` helper
- [ ] Create `/api/momentum/cards` endpoint

### Phase 4: Card UI (Frontend)
- [ ] Create `MomentumCard.vue` component
- [ ] Create `MomentumCardsSection.vue` with limit prop
- [ ] Style cards by type (color, icon)
- [ ] Add click handler → drawer

### Phase 5: Card Expansion (Integration)
- [ ] Create `/api/momentum/expand` endpoint
- [ ] Seed `MarketingAgent` with card context
- [ ] Create `CardExpansionDrawer.vue`
- [ ] Wire up follow-up questions

### Phase 6: Polish
- [ ] Add analytics tracking (which cards clicked, by source/type)
- [ ] Tune definition weights based on click data
- [ ] Add card refresh on date range change

---

## 9. Open Questions

1. **Weight Calibration**: Initial weights are guesses. How do we tune them based on real usage?

2. **Deduplication**: If multiple superlatives trigger similar cards (e.g., same campaign wins ROAS and conversions_value), should we dedupe?

3. **Card Staleness**: Learning cards are always "fresh" but monitors/superlatives age. Should old cards be deprioritized more aggressively?

4. **Frontend Limits**: Should we recommend a default limit (8? 10?) or let each view decide?

---

## 10. Summary

The Momentum Cards system generates questions from **centralized definitions**:

| Source | Definition Location | Triggers Card When |
|--------|--------------------|--------------------|
| Monitors | `*.monitor.ts` | Anomaly detected |
| Awards | `awards/library.ts` | Superlative wins award |
| Metrics | Entity `metrics` | Superlative wins on metric |
| Dimensions | Entity `superlatives` | Superlative in dimension |
| Executive | `executiveMetrics.ts` | Threshold exceeded |
| Learning | Entity `learningCards` | Always (low weight fallback) |

Key principles:
- **Single source of truth**: `weight`, `card`, `requires` defined at the source
- **Data-aware**: Cards only show when required data exists
- **Scored and sorted**: Higher weight = higher priority
- **Frontend flexibility**: Backend returns all valid cards, frontend decides display

No AI generation. No rigid constraints. Just templates, weights, and data availability.
