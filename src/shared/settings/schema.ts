/**
 * Zod validation schemas for account settings.
 * Two schemas: full (resolved) and patch (sparse overrides).
 */

import { z } from 'zod';

// ============================================================================
// INDIVIDUAL LAYER SCHEMAS
// ============================================================================

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
  customConfig: z.record(z.string(), z.unknown()).optional(),
});

export const PlatformPreferencesSchema = z.object({
  displayName: z.string().optional(),
  goalMetric: z.string().optional(),
  benchmarks: z.record(z.string(), z.number()).optional(),
});

// ============================================================================
// FULL SETTINGS SCHEMA (resolved)
// ============================================================================

/**
 * Full, resolved settings (what components consume and API returns).
 * This schema includes defaults for all required fields.
 */
export const AccountSettingsSchema = z.object({
  global: GlobalPreferencesSchema,
  sections: z.record(z.string(), SectionOverridesSchema).default({}),
  platforms: z.record(z.string(), PlatformPreferencesSchema).default({}),
});

// ============================================================================
// PATCH SCHEMA (sparse overrides)
// ============================================================================

/**
 * Sparse overrides (what's stored in the database and accepted by PATCH endpoint).
 * All fields are optional; only keys that differ from defaults are present.
 */
export const AccountSettingsPatchSchema = AccountSettingsSchema.partial();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AccountSettings = z.infer<typeof AccountSettingsSchema>;
export type AccountSettingsOverrides = z.infer<typeof AccountSettingsPatchSchema>;
export type GlobalPreferences = z.infer<typeof GlobalPreferencesSchema>;
export type SectionOverrides = z.infer<typeof SectionOverridesSchema>;
export type PlatformPreferences = z.infer<typeof PlatformPreferencesSchema>;
