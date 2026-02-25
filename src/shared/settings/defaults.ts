/**
 * System-wide default account settings.
 * All accounts start with these values unless they've explicitly overridden them.
 */

import type { AccountSettings } from './types';

export const defaultAccountSettings: AccountSettings = {
  global: {
    primaryGoal: 'revenue',
    currencyCode: 'USD',
    metricImportance: {},
    hiddenMetrics: [],
  },
  sections: {
    // Overviews tabs — show all metrics, no forced ordering
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

    // Dashboard
    'dashboard': {
      pinnedMetrics: undefined,
      layout: {},
    },

    // Monitors
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
