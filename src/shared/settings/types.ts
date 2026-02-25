/**
 * Account settings type definitions with type-safe dot-path access.
 * All settings types are defined here; shared between server and client.
 */

// ============================================================================
// GLOBAL PREFERENCES (Layer 1)
// ============================================================================

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

// ============================================================================
// SECTION OVERRIDES (Layer 2)
// ============================================================================

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

// ============================================================================
// PLATFORM PREFERENCES (Layer 3)
// ============================================================================

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

// ============================================================================
// COMPLETE SETTINGS TYPES
// ============================================================================

/**
 * Complete, resolved account settings (after defaults + merges applied).
 * This is what components and the API consume.
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

/**
 * Deep partial version of any type (all properties optional recursively).
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

// ============================================================================
// TYPE-SAFE DOT-PATH UTILITIES
// ============================================================================

/**
 * Generates all valid dot-notation paths for a type.
 *
 * Usage:
 * type SettingsPath = DotPath<AccountSettings>;
 * // → 'global.primaryGoal' | 'global.currencyCode' | 'sections' | ...
 *
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
 *
 * Usage:
 * type GoalType = GetByPath<AccountSettings, 'global.primaryGoal'>;
 * // → 'revenue' | 'leads' | 'awareness'
 *
 * Works with deeply nested paths.
 */
export type GetByPath<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? GetByPath<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;
