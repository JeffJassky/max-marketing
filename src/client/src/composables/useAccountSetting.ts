/**
 * Composable for accessing a single nested setting path.
 * Provides type-safe, reactive access with fallback defaults.
 */

import { computed, inject, type Ref } from 'vue';
import type { AccountSettings, DotPath, GetByPath } from '@shared/settings/types';

/**
 * Get a nested value from an object using dot notation.
 */
function getByPath(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Composable for a single setting path with type-safe access and defaults.
 *
 * Usage:
 * const pinnedMetrics = useAccountSetting(
 *   'sections.overviews.google.pinnedMetrics',
 *   [] // fallback default
 * );
 *
 * pinnedMetrics.value → reactive, updates when settings change
 *
 * @param path - Dot-notation path (type-safe)
 * @param defaultValue - Value to use if setting not found
 * @returns Computed ref with the setting value
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
