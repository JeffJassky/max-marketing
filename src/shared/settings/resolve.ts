/**
 * Settings resolution and deep merge utilities.
 * Implements the "sparse overrides + defaults" pattern.
 */

import type { AccountSettings, AccountSettingsOverrides } from './types';
import { defaultAccountSettings } from './defaults';

/**
 * Deep-merge account overrides with system defaults.
 * Later values win; undefined values fall through to defaults.
 *
 * This is the heart of the "sparse overrides" pattern.
 * Persisting only what changed, while benefiting from system defaults.
 *
 * JSON Merge Patch semantics (RFC 7396):
 * - undefined: ignore (fall through to default)
 * - null: explicitly delete (revert to default)
 * - scalar/array: override wins
 * - object: recurse
 */
export function resolveSettings(
  overrides: AccountSettingsOverrides
): AccountSettings {
  return deepMerge(defaultAccountSettings, overrides);
}

/**
 * Recursively merge two objects, with overrides winning.
 * Handles null as "delete this key" (JSON Merge Patch semantics).
 */
export function deepMerge(defaults: any, overrides: any): any {
  const result = { ...defaults };

  for (const key in overrides) {
    const overrideValue = overrides[key];

    // null = explicitly delete, revert to default
    if (overrideValue === null || overrideValue === undefined) {
      delete result[key];
      continue;
    }

    // If both are plain objects, recurse
    if (
      typeof overrideValue === 'object' &&
      !Array.isArray(overrideValue) &&
      typeof defaults[key] === 'object' &&
      !Array.isArray(defaults[key]) &&
      defaults[key] !== null
    ) {
      result[key] = deepMerge(defaults[key], overrideValue);
    } else {
      // Scalar or array: override wins
      result[key] = overrideValue;
    }
  }

  return result;
}

/**
 * Check if a value matches the system default.
 * Useful for knowing what a user has customized.
 */
export function isDifferentFromDefault(
  path: string,
  value: any,
  defaults: AccountSettings = defaultAccountSettings
): boolean {
  const keys = path.split('.');
  let defaultValue: any = defaults;

  for (const key of keys) {
    if (defaultValue == null) {
      return true; // Path doesn't exist in defaults, so it's different
    }
    defaultValue = defaultValue[key];
  }

  return JSON.stringify(value) !== JSON.stringify(defaultValue);
}
