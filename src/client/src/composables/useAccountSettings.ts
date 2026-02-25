/**
 * Global composable for fetching and managing account settings.
 * Provides cached settings and utilities for updating them.
 */

import { ref, readonly } from 'vue';
import type { AccountSettings, AccountSettingsOverrides } from '@shared/settings/types';

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
    if (!res.ok) {
      throw new Error(`Failed to fetch settings: ${res.statusText}`);
    }

    const settings = (await res.json()) as AccountSettings;
    cachedSettings.value = settings;
    return settings;
  } catch (err) {
    error.value = (err as Error).message;
    console.error('Error fetching account settings:', err);
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
  patch: AccountSettingsOverrides
): Promise<AccountSettings> {
  try {
    const res = await fetch(`/api/accounts/${accountId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });

    if (!res.ok) {
      throw new Error(`Failed to update settings: ${res.statusText}`);
    }

    const updated = (await res.json()) as AccountSettings;
    cachedSettings.value = updated;
    return updated;
  } catch (err) {
    error.value = (err as Error).message;
    console.error('Error updating account settings:', err);
    throw err;
  }
}

/**
 * Composable that provides cached settings and utilities.
 * Call this once at app init to set up the global state.
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
