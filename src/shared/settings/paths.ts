/**
 * Type-safe dot-notation path access utilities.
 * Allows getting and setting deeply nested values with compile-time type checking.
 */

import type { AccountSettings, AccountSettingsOverrides, DotPath, GetByPath } from './types';

/**
 * Type-safe getter for a nested value in AccountSettings.
 *
 * Usage:
 * const goal = getByPath(settings, 'global.primaryGoal');
 * // TypeScript knows goal is 'revenue' | 'leads' | 'awareness'
 *
 * Returns undefined if path doesn't exist.
 */
export function getByPath<P extends DotPath<AccountSettings>>(
  obj: AccountSettings,
  path: P
): GetByPath<AccountSettings, P> | undefined {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }

  return current as GetByPath<AccountSettings, P> | undefined;
}

/**
 * Type-safe setter for a nested value in AccountSettingsOverrides.
 * Creates missing intermediate objects as needed.
 *
 * Usage:
 * const patch = setByPath({}, 'global.primaryGoal', 'leads');
 * // patch now contains { global: { primaryGoal: 'leads' } }
 *
 * Returns the modified object (mutates in-place).
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
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
  return obj;
}

/**
 * Delete a nested value by setting it to null (JSON Merge Patch semantics).
 * This causes the value to revert to the system default on merge.
 *
 * Usage:
 * const patch = deleteByPath({}, 'sections.overviews.google.pinnedMetrics');
 * // patch now contains { sections: { overviews: { google: { pinnedMetrics: null } } } }
 */
export function deleteByPath(
  obj: AccountSettingsOverrides,
  path: DotPath<AccountSettings>
): AccountSettingsOverrides {
  return setByPath(obj, path, null);
}
