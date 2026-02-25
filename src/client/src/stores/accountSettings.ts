/**
 * Pinia store for account settings management.
 * Provides type-safe access to nested settings with automatic persistence.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { updateAccountSettings as updateSettingsApi } from '../composables/useAccountSettings';
import type { AccountSettings, DotPath, GetByPath, AccountSettingsOverrides } from '@shared/settings/types';

/**
 * Create a nested object by setting a value at the given dot-notation path.
 */
function setByPath(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;

  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
  return obj;
}

export const useAccountSettingsStore = defineStore('accountSettings', () => {
  const settings = ref<AccountSettings | null>(null);
  const savingPath = ref<string | null>(null);
  const error = ref<string | null>(null);

  /**
   * Set the current settings (called when fetched from server)
   */
  function setSettings(newSettings: AccountSettings): void {
    settings.value = newSettings;
  }

  /**
   * Type-safe setter for any nested setting path.
   * Only sends the changed path to the server (sparse update).
   * Uses optimistic updates - UI updates immediately, server syncs in background.
   *
   * Usage:
   * await updateSetting(accountId, 'global.hiddenMetrics', ['metric1', 'metric2'])
   * await updateSetting(accountId, 'sections.overviews.google.pinnedMetrics', ['spend', 'roas'])
   *
   * @param accountId - The account ID to update
   * @param path - Type-safe dot-notation path (compile-time checked)
   * @param value - The new value for that path
   */
  async function updateSetting<P extends DotPath<AccountSettings>>(
    accountId: string,
    path: P,
    value: GetByPath<AccountSettings, P>
  ): Promise<void> {
    if (!accountId) {
      error.value = 'Account ID is required';
      throw new Error('Account ID is required');
    }

    savingPath.value = path;
    error.value = null;

    // Optimistic update: update UI immediately with new value
    if (settings.value) {
      const keys = path.split('.');
      const lastKey = keys.pop()!;
      let current: any = settings.value;

      for (const key of keys) {
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }

      current[lastKey] = value;
    }

    // Sync with server in background
    try {
      const patch = setByPath({}, path, value) as AccountSettingsOverrides;
      const resolved = await updateSettingsApi(accountId, patch);
      // Update with server response to ensure consistency
      settings.value = resolved;
    } catch (err) {
      error.value = (err as Error).message;
      console.error(`Failed to update setting at ${path}:`, err);
      throw err;
    } finally {
      savingPath.value = null;
    }
  }

  /**
   * Check if a specific path is currently being saved
   */
  function isSaving(path?: string): boolean {
    if (!path) return savingPath.value !== null;
    return savingPath.value === path;
  }

  return {
    // State (as computed to be read-only in components)
    settings: computed(() => settings.value),
    savingPath: computed(() => savingPath.value),
    error: computed(() => error.value),

    // Actions
    setSettings,
    updateSetting,
    isSaving,
  };
});
