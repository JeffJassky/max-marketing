# Account Settings Management System

**Status**: Planning Phase
**Decision**: Approach C (Layered Defaults + Overrides)
**Last Updated**: 2026-02-25

---

## Executive Summary

This document defines a full-stack system for managing account-level settings and preferences. The goal is to transition the UI from hardcoded, static layouts to an **API-driven, customizable interface** where:

- Users can select which metrics are "hero" (prominent) vs "supporting" (secondary)
- Metric formatting, tooltips, and ordering come from the API
- Settings are sparse (only storing what users explicitly change)
- New defaults added in code instantly apply to all accounts
- Future user-level settings can layer on top without disruption

**Key Insight**: OverviewsView.vue has already been refactored to accept format and tooltip metadata from the API response. This plan implements the backend infrastructure to provide those details based on account settings.

---

## Architecture Decision: Approach C (Layered)

### Why Layered Over View-Centric or Metric-Registry

| Question | View-Centric | Metric-Registry | **Layered (C)** |
|----------|--------------|-----------------|-----------------|
| "Make ROAS prominent everywhere" | Repeat in every view | Set globally (rigid) | Set in `global`, views inherit |
| "Pin specific cards in Overviews" | Direct but verbose | Weight hacks (awkward) | **`sections` overrides (clean)** |
| New view added, works immediately? | No—new config shape | Yes | **Yes** |
| Storage size | Larger | Medium | **Smallest** |
| Complexity for v1 | Lowest | Medium | **Medium, high ROI** |
| Maintenance burden | High (duplication) | Medium (indirection) | **Low (DRY + clear cascade)** |

### Three-Layer Resolution Model

1. **Layer 1: Defaults** — System-wide defaults (all accounts start with these)
2. **Layer 2: Global Overrides** — Account-wide preferences (e.g., "I always care about ROAS")
3. **Layer 3: Section/Platform Overrides** — View-specific customizations (e.g., "In Overviews, show these metrics first")

Resolution rule: Later layers win; undefined values fall through to earlier layers.

---

## TypeScript Types

All types live in `src/shared/settings/types.ts`.

### Core Settings Type

```typescript
/**
 * Complete, resolved account settings (after defaults + merges applied).
 * This is what components consume.
 */
export interface AccountSettings {
  global: GlobalPreferences;
  sections?: Record<string, SectionOverrides>;
  platforms?: Record<string, PlatformPreferences>;
}

/**
 * Sparse overrides stored in the database.
 * Only keys that differ from system defaults are present.
 */
export type AccountSettingsOverrides = DeepPartial<AccountSettings>;
```

### Layer 1: Global Preferences

```typescript
export interface GlobalPreferences {
  /**
   * Primary business metric the account cares about.
   * Used for default metric ordering and emphasis.
   */
  primaryGoal: 'revenue' | 'leads' | 'awareness';

  /**
   * ISO 4217 currency code (e.g., 'USD', 'EUR', 'GBP').
   * Affects currency formatting throughout.
   */
  currencyCode: string;

  /**
   * Metric importance weights (1-10 scale).
   * Used to auto-order metrics in views if no explicit pinnedMetrics.
   * Key format: 'metric_id' (e.g., 'roas', 'cpa', 'engagement_rate')
   */
  metricImportance: Record<string, number>;

  /**
   * Metric IDs the user never wants to see.
   * These are filtered out at the API response level.
   */
  hiddenMetrics: string[];
}
```

### Layer 2: Section Overrides

```typescript
export interface SectionOverrides {
  /**
   * Explicitly ordered metric IDs to show first in summary cards.
   * If set, overrides global.metricImportance.
   * Only metrics here are promoted to "hero" (large cards).
   */
  pinnedMetrics?: string[];

  /**
   * Explicit layout size assignment per metric.
   * 'hero' = large summary card, 'standard' = smaller/supporting, 'hidden' = don't show.
   */
  layout?: Record<string, 'hero' | 'standard' | 'hidden'>;

  /**
   * Default active tab for this section (e.g., 'google', 'meta', 'your_overview').
   */
  defaultTab?: string;

  /**
   * Section-specific configuration (escape hatch for future extensions).
   * Used for things like "overviews.yourOverview.groupBy" = 'platform' | 'category'.
   */
  customConfig?: Record<string, any>;
}

/**
 * Example section keys:
 * - 'overviews.your_overview'
 * - 'overviews.google'
 * - 'overviews.meta'
 * - 'dashboard'
 * - 'monitors'
 * - 'google_ads' (for GoogleAdsView)
 */
```

### Layer 3: Platform Preferences

```typescript
export interface PlatformPreferences {
  /**
   * User-facing name for this platform connection.
   * Overrides the default label from the API.
   */
  displayName?: string;

  /**
   * The primary success metric for this platform.
   * Used for coloring, emphasis, and sorting.
   * Examples: 'roas' (Google Ads), 'cpa' (Meta), 'conversion_rate' (GA4)
   */
  goalMetric?: string;

  /**
   * Target benchmarks for metrics on this platform.
   * Used by components for contextual coloring/alerts.
   * Key format: 'metric_id', value: target value
   */
  benchmarks?: Record<string, number>;
}

/**
 * Platform keys: 'google', 'meta', 'ga4', 'shopify', 'instagram', 'facebook', 'gsc'
 */
```

### Type-Safe Dot-Path Access

```typescript
/**
 * Generates all valid dot-notation paths for a type.
 * Usage: DotPath<AccountSettings> → 'global.primaryGoal' | 'sections.overviews' | ...
 * Enables type-safe setting reads/writes without magic strings.
 */
export type DotPath<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${Prefix}${K}` | DotPath<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

/**
 * Infers the return type for a given dot-path.
 * Usage: GetByPath<AccountSettings, 'global.primaryGoal'> → 'revenue' | 'leads' | 'awareness'
 */
export type GetByPath<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? GetByPath<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;
```

### Validation Schemas (Zod)

```typescript
// src/shared/settings/schema.ts
import { z } from 'zod';

export const GlobalPreferencesSchema = z.object({
  primaryGoal: z.enum(['revenue', 'leads', 'awareness']).default('revenue'),
  currencyCode: z.string().default('USD'),
  metricImportance: z.record(z.string(), z.number().min(1).max(10)).default({}),
  hiddenMetrics: z.array(z.string()).default([]),
});

export const SectionOverridesSchema = z.object({
  pinnedMetrics: z.array(z.string()).optional(),
  layout: z.record(z.string(), z.enum(['hero', 'standard', 'hidden'])).optional(),
  defaultTab: z.string().optional(),
  customConfig: z.record(z.any()).optional(),
});

export const PlatformPreferencesSchema = z.object({
  displayName: z.string().optional(),
  goalMetric: z.string().optional(),
  benchmarks: z.record(z.string(), z.number()).optional(),
});

/**
 * Full, resolved settings (what components consume)
 */
export const AccountSettingsSchema = z.object({
  global: GlobalPreferencesSchema,
  sections: z.record(z.string(), SectionOverridesSchema).default({}),
  platforms: z.record(z.string(), PlatformPreferencesSchema).default({}),
});

/**
 * Sparse overrides (what's stored in the database + accepted by PATCH endpoint)
 */
export const AccountSettingsPatchSchema = AccountSettingsSchema.deepPartial();

export type AccountSettings = z.infer<typeof AccountSettingsSchema>;
export type AccountSettingsOverrides = z.infer<typeof AccountSettingsPatchSchema>;
```

---

## System Defaults

```typescript
// src/shared/settings/defaults.ts
export const defaultAccountSettings: AccountSettings = {
  global: {
    primaryGoal: 'revenue',
    currencyCode: 'USD',
    metricImportance: {},
    hiddenMetrics: [],
  },
  sections: {
    // Overviews: Show all metrics, no forced ordering
    'overviews.your_overview': {
      pinnedMetrics: undefined,
      layout: {},
    },
    'overviews.google': {
      pinnedMetrics: undefined,
      layout: {},
    },
    'overviews.meta': {
      pinnedMetrics: undefined,
      layout: {},
    },
    'overviews.ga4': {
      pinnedMetrics: undefined,
      layout: {},
    },
    'overviews.shopify': {
      pinnedMetrics: undefined,
      layout: {},
    },
    'overviews.instagram': {
      pinnedMetrics: undefined,
      layout: {},
    },
    'overviews.facebook': {
      pinnedMetrics: undefined,
      layout: {},
    },
    'overviews.gsc': {
      pinnedMetrics: undefined,
      layout: {},
    },

    // Dashboard: Defined elsewhere (future)
    'dashboard': {
      pinnedMetrics: undefined,
      layout: {},
    },

    // Monitors: Defined elsewhere (future)
    'monitors': {
      customConfig: { groupBy: 'severity' },
    },
  },
  platforms: {
    google: { goalMetric: 'roas' },
    meta: { goalMetric: 'roas' },
    ga4: { goalMetric: 'conversion_rate' },
    shopify: { goalMetric: 'revenue' },
    instagram: { goalMetric: 'engagement_rate' },
    facebook: { goalMetric: 'engagement_rate' },
    gsc: { goalMetric: 'ctr' },
  },
};
```

---

## Database Schema

### Option: Separate Settings Table (Recommended)

```sql
-- Create dataset if not exists
CREATE SCHEMA IF NOT EXISTS `amplify-11.app_data`;

-- Settings table (one row per account)
CREATE TABLE IF NOT EXISTS `amplify-11.app_data.account_settings` (
  account_id STRING NOT NULL,
  settings JSON,                    -- DeepPartial<AccountSettings> (overrides only)
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_by STRING,                -- Will be user_id when users are implemented
  PRIMARY KEY (account_id)
);
```

**Why separate from accounts table**:
- Settings have a different lifecycle (frequently updated, versioned for undo)
- Cleaner separation of concerns (account identity vs. user preferences)
- Foundation for future user-level settings override
- Can add audit/history columns later

### BigQuery JSON Column Details

- **Column**: `settings` stores `DeepPartial<AccountSettings>`
- **Size**: Typical account settings ~500 bytes uncompressed
- **Query Examples**:
  ```sql
  -- Read all settings for an account
  SELECT settings FROM `amplify-11.app_data.account_settings` WHERE account_id = 'acc_123';

  -- Read nested field
  SELECT JSON_EXTRACT_SCALAR(settings, '$.global.primaryGoal') FROM ...;

  -- Update single field (via application code)
  UPDATE `amplify-11.app_data.account_settings`
  SET settings = JSON_SET(settings, '$.global.primaryGoal', '"revenue"')
  WHERE account_id = 'acc_123';
  ```

---

## File Structure

```
src/shared/settings/
├── types.ts                    # All TypeScript interfaces + DotPath utilities
├── schema.ts                   # Zod validation schemas
├── defaults.ts                 # defaultAccountSettings constant
├── resolve.ts                  # resolveSettings() + deepMerge() functions
└── paths.ts                    # Type-safe get/set helper utilities

src/server/models/
└── AccountSettingsModel.ts     # Extends AppDataModel, manages BigQuery table

src/server/
└── index.ts                    # Routes:
                                # GET /api/accounts/:id/settings
                                # PATCH /api/accounts/:id/settings

src/client/src/composables/
├── useAccountSettings.ts       # Fetches & caches resolved settings (global state)
└── useAccountSetting.ts        # Single-path reactive accessor (component-level)

src/client/src/views/
└── SettingsView.vue            # UI for users to edit account settings (future)
```

---

## Core Implementation: Shared Utilities

### Resolution Logic

```typescript
// src/shared/settings/resolve.ts
import { defaultAccountSettings, AccountSettings, AccountSettingsOverrides } from './types';

/**
 * Deep-merge account overrides with system defaults.
 * Later values win; undefined values fall through to defaults.
 *
 * This is the heart of the "sparse overrides" pattern.
 */
export function resolveSettings(overrides: AccountSettingsOverrides): AccountSettings {
  return deepMerge(defaultAccountSettings, overrides);
}

/**
 * Recursive deep merge (defaults first, overrides win).
 * Handles arrays by replacement (not merging).
 */
function deepMerge<T extends Record<string, any>>(defaults: T, overrides: any): T {
  const result = { ...defaults };

  for (const key in overrides) {
    if (overrides[key] === null || overrides[key] === undefined) {
      // Explicit null = revert to default (JSON Merge Patch semantics)
      delete result[key];
    } else if (
      typeof overrides[key] === 'object' &&
      !Array.isArray(overrides[key]) &&
      typeof defaults[key] === 'object' &&
      !Array.isArray(defaults[key])
    ) {
      // Recursive merge for nested objects
      result[key] = deepMerge(defaults[key], overrides[key]);
    } else {
      // Scalar or array: override wins
      result[key] = overrides[key];
    }
  }

  return result;
}
```

### Type-Safe Path Access

```typescript
// src/shared/settings/paths.ts
import { AccountSettings, GetByPath, DotPath } from './types';

/**
 * Type-safe getter for a nested value.
 * Example: getByPath(settings, 'global.primaryGoal') → 'revenue' (typed)
 */
export function getByPath<P extends DotPath<AccountSettings>>(
  obj: AccountSettings,
  path: P
): GetByPath<AccountSettings, P> {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current == null) return undefined as any;
    current = current[key];
  }

  return current as GetByPath<AccountSettings, P>;
}

/**
 * Type-safe setter for a nested value.
 * Example: setByPath(settings, 'global.primaryGoal', 'leads')
 */
export function setByPath(
  obj: AccountSettingsOverrides,
  path: DotPath<AccountSettings>,
  value: any
): AccountSettingsOverrides {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current: any = obj;

  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
  return obj;
}
```

---

## Backend Implementation

### AccountSettingsModel

```typescript
// src/server/models/AccountSettingsModel.ts
import { z } from 'zod';
import { AppDataModel } from './AppDataModel';
import { AccountSettingsOverridesSchema } from '../../shared/settings/schema';

const AccountSettingsRowSchema = z.object({
  account_id: z.string(),
  settings: z.record(z.any()).nullable(),
  updated_at: z.string(),
  updated_by: z.string().optional(),
});

export class AccountSettingsModel extends AppDataModel<typeof AccountSettingsRowSchema> {
  readonly datasetId = 'app_data';
  readonly tableId = 'account_settings';
  readonly schema = AccountSettingsRowSchema;

  /**
   * Get overrides for an account (or empty object if not found).
   */
  async getOverrides(accountId: string): Promise<AccountSettingsOverrides> {
    const query = `
      SELECT settings FROM ${this.fqn}
      WHERE account_id = @accountId
      LIMIT 1
    `;
    const [rows] = await this.bq.query({
      query,
      params: { accountId },
    });

    if (rows.length === 0) return {};
    return (rows[0].settings as AccountSettingsOverrides) || {};
  }

  /**
   * Save overrides for an account (creates or updates).
   */
  async setOverrides(accountId: string, overrides: AccountSettingsOverrides): Promise<void> {
    // Validate overrides against patch schema
    const validated = AccountSettingsPatchSchema.parse(overrides);

    const query = `
      INSERT INTO ${this.fqn} (account_id, settings, updated_at)
      VALUES (@accountId, @settings, CURRENT_TIMESTAMP())
      ON CONFLICT (account_id) DO UPDATE SET
        settings = @settings,
        updated_at = CURRENT_TIMESTAMP()
    `;

    await this.bq.query({
      query,
      params: {
        accountId,
        settings: JSON.stringify(validated),
      },
    });
  }
}

export const accountSettingsModel = new AccountSettingsModel();
```

### API Routes

```typescript
// In src/server/index.ts

import { resolveSettings } from '../shared/settings/resolve';
import { AccountSettingsPatchSchema } from '../shared/settings/schema';
import { accountSettingsModel } from './models/AccountSettingsModel';

/**
 * GET /api/accounts/:id/settings
 * Returns the fully resolved settings (defaults + account overrides merged)
 */
app.get('/api/accounts/:id/settings', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch overrides from database
    const overrides = await accountSettingsModel.getOverrides(id);

    // Resolve with defaults
    const resolved = resolveSettings(overrides);

    res.json(resolved);
  } catch (error) {
    console.error('Error fetching account settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PATCH /api/accounts/:id/settings
 * Merges partial settings with existing overrides (JSON Merge Patch semantics).
 * Sending null for a key reverts it to the system default.
 *
 * Example request body:
 * {
 *   "global": {
 *     "primaryGoal": "leads"
 *   },
 *   "sections": {
 *     "overviews.google": {
 *       "pinnedMetrics": ["spend", "roas"]
 *     }
 *   }
 * }
 */
app.patch('/api/accounts/:id/settings', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patch = req.body;

    // Validate patch shape
    const validated = AccountSettingsPatchSchema.parse(patch);

    // Read current overrides
    const current = await accountSettingsModel.getOverrides(id);

    // Merge patch into current (JSON Merge Patch semantics)
    const merged = deepMerge(current, validated);

    // Persist back to database
    await accountSettingsModel.setOverrides(id, merged);

    // Return fully resolved settings
    const resolved = resolveSettings(merged);
    res.json(resolved);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid settings shape', details: error.errors });
    } else {
      console.error('Error updating account settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
});
```

---

## Frontend Implementation

### useAccountSettings (Global State)

```typescript
// src/client/src/composables/useAccountSettings.ts
import { ref, readonly, computed } from 'vue';
import type { AccountSettings } from '@shared/settings/types';

const cachedSettings = ref<AccountSettings | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

/**
 * Fetch and cache resolved settings for the current account.
 * Called once on app init or when account changes.
 */
export async function fetchAccountSettings(accountId: string): Promise<AccountSettings> {
  loading.value = true;
  error.value = null;

  try {
    const res = await fetch(`/api/accounts/${accountId}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');

    const settings = await res.json() as AccountSettings;
    cachedSettings.value = settings;
    return settings;
  } catch (err) {
    error.value = (err as Error).message;
    throw err;
  } finally {
    loading.value = false;
  }
}

/**
 * Update account settings via PATCH endpoint.
 * Only send what's changed; null values revert to defaults.
 */
export async function updateAccountSettings(
  accountId: string,
  patch: DeepPartial<AccountSettings>
): Promise<AccountSettings> {
  try {
    const res = await fetch(`/api/accounts/${accountId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });

    if (!res.ok) throw new Error('Failed to update settings');

    const updated = await res.json() as AccountSettings;
    cachedSettings.value = updated;
    return updated;
  } catch (err) {
    error.value = (err as Error).message;
    throw err;
  }
}

/**
 * Composable that provides cached settings and utilities.
 */
export function useAccountSettings() {
  return {
    settings: readonly(cachedSettings),
    loading: readonly(loading),
    error: readonly(error),
    fetch: fetchAccountSettings,
    update: updateAccountSettings,
  };
}
```

### useAccountSetting (Component-Level)

```typescript
// src/client/src/composables/useAccountSetting.ts
import { computed, inject, type Ref } from 'vue';
import type { AccountSettings, DotPath, GetByPath } from '@shared/settings/types';
import { getByPath } from '@shared/settings/paths';

/**
 * Composable for a single setting path with type-safe access and defaults.
 * Usage in components:
 *
 * const pinnedMetrics = useAccountSetting(
 *   'sections.overviews.google.pinnedMetrics',
 *   [] // fallback default
 * );
 *
 * pinnedMetrics.value → reactive, updates when settings change
 */
export function useAccountSetting<P extends DotPath<AccountSettings>>(
  path: P,
  defaultValue: GetByPath<AccountSettings, P>
) {
  // Settings should be injected at app root by App.vue
  const accountSettings = inject<Ref<AccountSettings | null>>('accountSettings');

  return computed(() => {
    if (!accountSettings?.value) return defaultValue;
    return getByPath(accountSettings.value, path) ?? defaultValue;
  });
}
```

### App.vue Integration

```vue
<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
import { useAccountSettings, fetchAccountSettings } from './composables/useAccountSettings';

const selectedAccount = ref<MaxAccount | null>(null);
const { settings: accountSettings } = useAccountSettings();

// When account changes, fetch its settings
const selectAccount = async (account: MaxAccount) => {
  selectedAccount.value = account;
  try {
    await fetchAccountSettings(account.id);
  } catch (err) {
    console.error('Failed to load account settings:', err);
  }
};

// Provide settings to all child components
provide('accountSettings', accountSettings);
</script>

<template>
  <!-- Your app structure -->
</template>
```

### Using in OverviewsView.vue

```typescript
// In OverviewsView.vue script
import { useAccountSetting } from '../composables/useAccountSetting';

// Get pinned metrics for the current platform
const pinnedMetrics = useAccountSetting(
  'sections.overviews.google.pinnedMetrics',
  [] // fallback: no explicit pinning, show all
);

// Later, when rendering summary cards:
// v-for="header in pinnedMetrics || reportData.headers.filter(...)"
```

---

## Integration with OverviewsView.vue

The recent refactoring of OverviewsView.vue to use `format` and `tooltip` from headers creates the perfect foundation. Here's how settings wire in:

### Current State (Already Done)
- ✅ `ReportHeader` now has `format` and `tooltip` fields
- ✅ `formatValue()` uses explicit format types instead of key conventions
- ✅ All metrics shown, not hardcoded top 4

### Next Integration Points
1. **Backend `buildReportQuery()`** enriches headers with:
   - `format` (from metric definition + account settings)
   - `tooltip` (from metric definition + account settings)
   - `displaySize` (optional: 'hero' | 'standard', for future prominence control)

2. **Frontend filters/reorders headers** based on:
   - `account.sections['overviews.google'].pinnedMetrics` → reorder headers
   - `account.global.hiddenMetrics` → filter headers out
   - `account.sections['overviews.google'].layout['spend']` → control card size

3. **Example: Pinning metrics in Google Ads tab**
   ```typescript
   // If account settings say:
   // { "sections": { "overviews.google": { "pinnedMetrics": ["spend", "roas"] } } }

   // Then the component renders:
   // [1] Spend card (hero)
   // [2] ROAS card (hero)
   // [3] Impressions card (standard)
   // [4] Clicks card (standard)
   // ... all other metrics
   ```

---

## Best Practices & Patterns

### Dot-Path Type Safety
- Always use `DotPath<AccountSettings>` for path parameters
- Never use magic strings like `'sections.overviews'`
- Editor autocomplete will guide the correct path

### Sparse Storage
- Never store a value in the database if it matches the default
- Use `null` to explicitly revert to default (not `undefined`)
- Example: `PATCH /api/accounts/abc/settings` with `{ "sections": { "overviews": null } }` reverts that entire section

### Resolution at Read Time
- Database only stores overrides (compact)
- Full settings resolved when accessed (flexible, future-proof)
- New defaults added in code instantly apply to all accounts

### API Contracts
- GET returns fully resolved settings
- PATCH accepts sparse overrides (JSON Merge Patch)
- Validation happens at boundary (Zod)

### Component Access
- Global state: `const { settings } = useAccountSettings()`
- Single-path: `const goal = useAccountSetting('global.primaryGoal', 'revenue')`
- Never pass settings through props if possible (use injection)

---

## Migration & Rollout

### Phase 1: Foundation (v1)
1. Create `src/shared/settings/` module (types, schema, defaults, resolve, paths)
2. Create `AccountSettingsModel` (BigQuery table)
3. Add GET/PATCH routes in server
4. Create client composables
5. Inject settings in App.vue
6. **Zero UI changes** — settings exist but aren't used yet

### Phase 2: Overviews (v2)
1. Wire OverviewsView.vue to read `pinnedMetrics` and `hiddenMetrics`
2. Reorder headers based on settings
3. Update header enrichment in `buildReportQuery()`
4. Add "Settings" UI for users to customize (future)

### Phase 3: Dashboard, Google Ads, Monitors (v3+)
- Same pattern applied to other views
- Each view requests its section's settings

### No Breaking Changes
- Accounts without explicit settings work normally (use defaults)
- Can opt-in per-view as features land
- Settings are additive—no removal needed

---

## Testing Strategy

### Backend
- Unit: `resolveSettings()` merges correctly with various override shapes
- Integration: CRUD operations on BigQuery
- API: GET returns resolved, PATCH merges and returns resolved

### Frontend
- Unit: `getByPath()`, `setByPath()` work with complex paths
- Component: `useAccountSetting()` reactively updates
- E2E: Fetch settings → update → verify in API → verify in UI

---

## Future Extensions

### User-Level Settings (When Users Land)
```typescript
interface UserSettings extends AccountSettings {
  // User can override account-level settings
}

// Resolution: defaults → account → user (last wins)
resolveUserSettings(defaultSettings, accountSettings, userSettings)
```

### Settings UI (SettingsView.vue)
- Show current account settings
- Form to edit `global.primaryGoal`, `global.hiddenMetrics`, etc.
- Per-section customization (pinned metrics, layout)
- Preview live changes

### Audit Trail
- Add `updated_by` to settings table
- Store historical snapshots for rollback
- Log changes via server

### Export/Import
- Export account settings as JSON
- Import to new account (onboarding helper)
- Clone settings between accounts

---

## Key Files at a Glance

| File | Purpose | Status |
|------|---------|--------|
| `src/shared/settings/types.ts` | All TypeScript interfaces | **To Create** |
| `src/shared/settings/schema.ts` | Zod validation | **To Create** |
| `src/shared/settings/defaults.ts` | System defaults | **To Create** |
| `src/shared/settings/resolve.ts` | Merge logic | **To Create** |
| `src/shared/settings/paths.ts` | Type-safe accessors | **To Create** |
| `src/server/models/AccountSettingsModel.ts` | BigQuery model | **To Create** |
| `src/server/index.ts` | GET/PATCH routes | **To Add** |
| `src/client/src/composables/useAccountSettings.ts` | Global state | **To Create** |
| `src/client/src/composables/useAccountSetting.ts` | Single-path | **To Create** |
| `src/client/src/views/OverviewsView.vue` | Integration point | **Already Refactored** |

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Approach C (Layered) | Best balance: sparse storage, flexible, scales across views |
| Separate settings table | Cleaner lifecycle, audit-ready, foundation for user settings |
| Sparse overrides in DB | Compact, future-proof, no migrations when defaults change |
| Resolution at read time | Flexible, no update burden, new defaults apply instantly |
| JSON Merge Patch semantics | Standard (RFC 7396), intuitive, supports explicit null revert |
| Type-safe dot paths | Compile-time safety, editor autocomplete, no magic strings |
| Zod for validation | Already in use, `.deepPartial()` handles sparse shapes naturally |

---

## Success Criteria

✅ **Completion Checklist**

- [ ] All shared types defined and exported
- [ ] Zod schemas created and validated
- [ ] Defaults exported as constant
- [ ] `resolveSettings()` and `deepMerge()` implemented and tested
- [ ] `getByPath()` and `setByPath()` working with type safety
- [ ] BigQuery table created with proper schema
- [ ] `AccountSettingsModel` extends AppDataModel correctly
- [ ] GET and PATCH routes implemented and tested
- [ ] Client composables created and tested
- [ ] Settings injected in App.vue
- [ ] OverviewsView.vue wired to read settings (Phase 2)
- [ ] No regressions—all existing views still work

---

**Next Step**: Begin Phase 1 implementation (shared types and validation).
