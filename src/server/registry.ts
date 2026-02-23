import { accountSpendAnomalyMonitor } from "../jobs/entities/ads-daily/monitors/account-spend-anomaly.monitor";
import { accountConversionDropMonitor } from "../jobs/entities/ads-daily/monitors/account-conversion-drop.monitor";
import { activePmaxCampaignMonitor } from "../jobs/entities/pmax-daily/monitors/active-pmax-campaign.monitor";
import { activeAdsCampaignMonitor } from "../jobs/entities/ads-daily/monitors/active-ads-campaign.monitor";
import { wastedSpendConversionMonitor } from "../jobs/entities/keyword-daily/monitors/wasted-spend-conversion.monitor";
import { wastedSpendClickMonitor } from "../jobs/entities/keyword-daily/monitors/wasted-spend-click.monitor";
import { highCPAMonitor } from "../jobs/entities/keyword-daily/monitors/high-cpa.monitor";
import { lowROASMonitor } from "../jobs/entities/keyword-daily/monitors/low-roas.monitor";
import { broadMatchDriftMonitor } from "../jobs/entities/keyword-daily/monitors/broad-match-drift.monitor";
import { audienceSaturationMonitor } from "../jobs/entities/ads-daily/monitors/audience-saturation.monitor";
import { creativeFatigueMonitor } from "../jobs/entities/creative-daily/monitors/creative-fatigue.monitor";
import { gscPositionDropMonitor } from "../jobs/entities/gsc-daily/monitors/position-drop.monitor";
import { gscClickDropMonitor } from "../jobs/entities/gsc-daily/monitors/click-drop.monitor";
import { gscImpressionDropMonitor } from "../jobs/entities/gsc-daily/monitors/impression-drop.monitor";

import { pmaxSpendBreakdown } from "../jobs/entities/pmax-daily/aggregateReports/pmax-spend-breakdown.aggregateReport";
import { adsSpendBreakdown } from "../jobs/entities/ads-daily/aggregateReports/ads-spend-breakdown.aggregateReport";
import { googleAdsCampaignPerformance } from "../jobs/entities/ads-daily/aggregateReports/google-ads-campaign.aggregateReport";
import { metaAdsCampaignPerformance } from "../jobs/entities/ads-daily/aggregateReports/meta-ads-campaign.aggregateReport";
import { ga4AcquisitionPerformance } from "../jobs/entities/ga4-daily/aggregateReports/ga4-acquisition.aggregateReport";
import { shopifySourcePerformance } from "../jobs/entities/shopify-daily/aggregateReports/shopify-source.aggregateReport";
import { socialPlatformPerformance } from "../jobs/entities/social-media-daily/aggregateReports/social-platform.aggregateReport";
import { instagramPostPerformance } from "../jobs/entities/social-media-daily/aggregateReports/instagram-post-performance.aggregateReport";
import { facebookPostPerformance } from "../jobs/entities/social-media-daily/aggregateReports/facebook-post-performance.aggregateReport";
import { creativePerformanceReport } from "../jobs/entities/creative-daily/aggregateReports/creative-performance.aggregateReport";
import { brandVoiceCreativePerformance } from "../jobs/entities/creative-daily/aggregateReports/brand-voice-creative.aggregateReport";
import { gscQueryPerformance } from "../jobs/entities/gsc-daily/aggregateReports/gsc-query-performance.aggregateReport";
import { gscPagePerformance } from "../jobs/entities/gsc-daily/aggregateReports/gsc-page-performance.aggregateReport";

// Entities
import { adsDaily } from "../jobs/entities/ads-daily/ads-daily.entity";
import { creativeDaily } from "../jobs/entities/creative-daily/creative-daily.entity";
import { ga4Daily } from "../jobs/entities/ga4-daily/ga4-daily.entity";
import { keywordDaily } from "../jobs/entities/keyword-daily/keyword-daily.entity";
import { pmaxDaily } from "../jobs/entities/pmax-daily/pmax-daily.entity";
import { shopifyDaily } from "../jobs/entities/shopify-daily/shopify-daily.entity";
import { shopifyProductDaily } from "../jobs/entities/shopify-daily/shopify-product-daily.entity";
import { socialMediaDaily } from "../jobs/entities/social-media-daily/social-media-daily.entity";
import { gscDaily } from "../jobs/entities/gsc-daily/gsc-daily.entity";

// Imports
import { googleAdsCampaignPerformance as googleAdsImport } from "../jobs/imports/google_ads/campaign-performance.import";
import { facebookAdsInsights as metaAdsImport } from "../jobs/imports/facebook_ads/insights.import";
import { shopifyOrders as shopifyOrdersImport } from "../jobs/imports/shopify/orders.import";
import { ga4PagePerformance as ga4PageImport } from "../jobs/imports/google_ga4/page-performance.import";
import { googleSearchConsoleAnalytics as gscImport } from "../jobs/imports/google_search_console/search-analytics.import";

export const coreMonitors = [
  accountSpendAnomalyMonitor,
  accountConversionDropMonitor,
  activePmaxCampaignMonitor,
  activeAdsCampaignMonitor,
  wastedSpendConversionMonitor,
  wastedSpendClickMonitor,
  highCPAMonitor,
  lowROASMonitor,
  broadMatchDriftMonitor,
  audienceSaturationMonitor,
  creativeFatigueMonitor,
  gscPositionDropMonitor,
  gscClickDropMonitor,
  gscImpressionDropMonitor,
];

export const allAggregateReports = [
  pmaxSpendBreakdown,
  adsSpendBreakdown,
  googleAdsCampaignPerformance,
  metaAdsCampaignPerformance,
  ga4AcquisitionPerformance,
  shopifySourcePerformance,
  socialPlatformPerformance,
  instagramPostPerformance,
  facebookPostPerformance,
  creativePerformanceReport,
  brandVoiceCreativePerformance,
  gscQueryPerformance,
  gscPagePerformance,
];

export const allEntities = [
  adsDaily,
  creativeDaily,
  ga4Daily,
  keywordDaily,
  pmaxDaily,
  shopifyDaily,
  shopifyProductDaily,
  socialMediaDaily,
  gscDaily,
];

export const allImports = [
  googleAdsImport,
  metaAdsImport,
  shopifyOrdersImport,
  ga4PageImport,
  gscImport,
];


export const getSchemaCatalog = () => {
  const catalog: Record<string, { 
    description: string, 
    type: 'entity' | 'import' | 'report',
    fields: Record<string, { type: string, description?: string, isMetric: boolean }> 
  }> = {};

  // 1. Entities
  allEntities.forEach(entity => {
    const fields: Record<string, any> = {};
      // Dimensions
      Object.entries(entity.definition.dimensions).forEach(([name, def]) => {
        let knownValues: string[] = [];
        if (name === 'platform') {
          // Identify platforms based on the entity sources
          const platforms = entity.definition.sources.map(s => s.definition.platform);
          if (platforms.includes('google_ads')) knownValues.push('google');
          if (platforms.includes('facebook')) knownValues.push('facebook');
          if (platforms.includes('instagram')) knownValues.push('instagram');
          if (platforms.includes('shopify')) knownValues.push('shopify');
        }
        if (name === 'customer_type') knownValues = ['new', 'returning'];
        if (name === 'channel_group' && entity.id === 'adsDaily') {
          knownValues = ['SEARCH', 'PERFORMANCE_MAX', 'VIDEO', 'DISPLAY', 'DEMAND_GEN', 'Feed', 'Reels', 'Stories', 'Marketplace'];
        }

        fields[name] = {
          type: (def.type as any)._def?.typeName?.replace('Zod', '') || 'string',
          description: name === 'account_id' ? 'The platform-specific account identifier' : '',
          knownValues: knownValues.length > 0 ? knownValues : undefined,
          isMetric: false
        };
      });
    Object.entries(entity.definition.metrics).forEach(([name, def]) => {
      fields[name] = {
        type: (def.type as any)._def?.typeName?.replace('Zod', '') || 'number',
        description: `Aggregated via ${def.aggregation}`,
        isMetric: true
      };
    });
    catalog[entity.id] = { description: entity.description, type: 'entity', fields };
  });

  // 2. Imports
  allImports.forEach(imp => {
    const fields: Record<string, any> = {};
    Object.entries(imp.definition.dimensions).forEach(([name, def]) => {
      fields[name] = { type: (def as any)._def?.typeName?.replace('Zod', '') || 'string', isMetric: false };
    });
    Object.entries(imp.definition.metrics).forEach(([name, def]) => {
      fields[name] = { type: (def as any)._def?.typeName?.replace('Zod', '') || 'number', isMetric: true };
    });
    catalog[imp.id] = { description: imp.description, type: 'import', fields };
  });

  // 3. Special Tables
  catalog['Anomalies'] = {
    description: 'System-detected anomalies and performance alerts.',
    type: 'report',
    fields: {
      id: { type: 'string', isMetric: false },
      account_id: { type: 'string', isMetric: false },
      measure_id: { type: 'string', isMetric: false },
      severity: { type: 'string', isMetric: false },
      message: { type: 'string', isMetric: false },
      detected_at: { type: 'timestamp', isMetric: false },
      payload: { type: 'string', description: 'JSON data associated with the anomaly', isMetric: false }
    }
  };

  catalog['Superlatives'] = {
    description: 'Monthly achievements and performance superlatives (Hall of Fame).',
    type: 'report',
    fields: {
      account_id: { type: 'string', isMetric: false },
      period_label: { type: 'string', description: 'YYYY-MM', isMetric: false },
      metric_name: { type: 'string', isMetric: false },
      dimension_label: { type: 'string', isMetric: false },
      entity_name: { type: 'string', description: 'The display name of the winner', isMetric: false },
      value: { type: 'number', isMetric: true },
      position: { type: 'number', description: 'Rank (1, 2, 3)', isMetric: false },
      awards: { type: 'string', description: 'JSON array of award IDs', isMetric: false }
    }
  };

  return catalog;
};