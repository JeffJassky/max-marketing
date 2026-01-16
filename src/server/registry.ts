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

import { pmaxSpendBreakdown } from "../jobs/entities/pmax-daily/aggregateReports/pmax-spend-breakdown.aggregateReport";
import { adsSpendBreakdown } from "../jobs/entities/ads-daily/aggregateReports/ads-spend-breakdown.aggregateReport";
import { googleAdsCampaignPerformance } from "../jobs/entities/ads-daily/aggregateReports/google-ads-campaign.aggregateReport";
import { metaAdsCampaignPerformance } from "../jobs/entities/ads-daily/aggregateReports/meta-ads-campaign.aggregateReport";
import { ga4AcquisitionPerformance } from "../jobs/entities/ga4-daily/aggregateReports/ga4-acquisition.aggregateReport";
import { shopifySourcePerformance } from "../jobs/entities/shopify-daily/aggregateReports/shopify-source.aggregateReport";
import { socialPlatformPerformance } from "../jobs/entities/social-media-daily/aggregateReports/social-platform.aggregateReport";
import { creativePerformanceReport } from "../jobs/entities/creative-daily/aggregateReports/creative-performance.aggregateReport";

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
];

export const allAggregateReports = [
  pmaxSpendBreakdown,
  adsSpendBreakdown,
  googleAdsCampaignPerformance,
  metaAdsCampaignPerformance,
  ga4AcquisitionPerformance,
  shopifySourcePerformance,
  socialPlatformPerformance,
  creativePerformanceReport,
];
