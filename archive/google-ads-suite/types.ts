import { ReactNode } from 'react';

// Navigation Views
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  GOOGLE_ADS = 'GOOGLE_ADS',
  SOCIAL_SPARK = 'SOCIAL_SPARK',
  LOCAL_SEO = 'LOCAL_SEO',
  SETTINGS = 'SETTINGS'
}

// Google Ads Suite Sub-views
export enum GoogleAdsSubView {
  OVERVIEW = 'OVERVIEW',
  KEYWORD_INTEL = 'KEYWORD_INTEL', // Cluster A
  WASTE_GUARD = 'WASTE_GUARD',     // Cluster B
  CREATIVE_LAB = 'CREATIVE_LAB',   // Cluster D
  PMAX_POWER = 'PMAX_POWER',       // Cluster E
  CAMPAIGN_OPS = 'CAMPAIGN_OPS',   // Cluster C
  ROADMAP = 'ROADMAP'
}

// Data Models
export interface Metric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
}

export interface PredictedEngagement {
  reach: string;
  traffic: string;
  revenue: string;
}

export interface InsightCardData {
  id: string;
  type: 'WASTE' | 'OPPORTUNITY' | 'ALERT';
  title: string;
  description: string;
  metrics: Metric[];
  predictedEngagement?: PredictedEngagement;
  actionLabel: string;
  impactLabel?: string; // e.g., "High Impact"
  category: string;
}

export interface CustomerProfile {
  name: string;
  locations: string[];
  primaryVertical: string;
}

export interface ActionLog {
  date: string;
  action: string;
  savings: string;
  status?: 'Pending' | 'Applied' | 'Failed';
}

export interface RoadmapTask {
  id: string;
  label: string;
  subLabel: string;
  completed: boolean;
  month: 1 | 2;
  impact: 'High' | 'Medium' | 'Low';
  category: string;
}

// --- SHARED TYPES ---
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type UserGoal = 'CPA' | 'ROAS';

// --- CLUSTER A: Keyword Intelligence Types ---

export interface NegativeKeywordOpportunity {
  id: string;
  searchTerm: string;
  matchType: 'Broad' | 'Phrase' | 'Exact';
  campaignName: string;
  spend: string;
  conversions: number;
  clicks: number;
  potentialSavings: string;
  intentTag: 'Job Seeker' | 'Free Seeker' | 'Competitor' | 'Irrelevant';
  confidenceScore: number; // 0-100
  confidenceLevel: ConfidenceLevel;
}

export interface SearchTermDrift {
  id: string;
  keyword: string; // The target keyword
  matchType: string;
  searchTerm: string; // The actual query
  semanticDistance: 'High' | 'Medium' | 'Low'; // How far it drifted
  spend: string;
  driftScore: number; // 0-100
  confidenceLevel: ConfidenceLevel;
}

export interface LowPerfKeyword {
  id: string;
  keyword: string;
  campaign: string;
  spend: string;
  cpa: string; // Cost per acquisition
  roas: string;
  qs: number;
  issue: 'Zero Conversions' | 'High CPA' | 'Low ROAS' | 'Low QS';
  confidenceLevel: ConfidenceLevel;
}

// --- CLUSTER B: Waste & Settings Types ---

export interface WasteMetric {
  id: string;
  dimension: 'Location' | 'Device' | 'Time' | 'Network' | 'Placement';
  segmentName: string; // e.g., "Mobile Apps" or "Alaska"
  spend: string;
  conversions: number;
  roas: string;
  wasteScore: number; // 1-100 severity
  recommendation: string;
  impactLevel: 'High' | 'Medium' | 'Low';
  potentialSavings: string;
}

export interface ConversionHealth {
  id: string;
  actionName: string;
  platformSource: 'Google Ads';
  comparisonSource: 'GA4' | 'Shopify';
  discrepancy: string; // e.g. "+45%"
  status: 'Healthy' | 'Overcounting' | 'Undercounting' | 'Inactive';
  severity: 'Critical' | 'Warning' | 'Info';
  issueDescription: string;
}

export interface SettingsAuditItem {
  id: string;
  settingName: string;
  campaign: string;
  currentValue: string;
  recommendedValue: string;
  impact: 'High' | 'Medium';
  estimatedSavings: string;
}

// --- CLUSTER C: Campaign Ops Types ---

export interface BidStrategyStatus {
  id: string;
  campaign: string;
  currentStrategy: string; // e.g., "Max Conversions"
  recommendedStrategy: string;
  status: 'Learning' | 'Limited' | 'Misconfigured' | 'Optimized';
  reason: string; // e.g. "Not enough conversion data (12/mo)"
  upliftPotential: string;
}

export interface BudgetPacing {
  id: string;
  campaign: string;
  dailyBudget: string;
  currentSpend: string;
  projectedSpend: string;
  roas: string;
  status: 'Underpacing' | 'On Track' | 'Overpacing' | 'Limited by Budget';
  reallocationOpportunity?: {
    targetCampaign: string;
    amount: string;
    projectedUplift: string;
  };
}

// --- CLUSTER D: Creative Lab Types ---

export interface QualityScoreComponent {
  component: 'Expected CTR' | 'Ad Relevance' | 'Landing Page Exp';
  status: 'Above Average' | 'Average' | 'Below Average';
}

export interface QualityScoreItem {
  id: string;
  keyword: string;
  score: number; // 1-10
  components: QualityScoreComponent[];
  costPenalty: string; // Est. cost due to low QS
  campaign: string;
}

export interface AdAssetPerformance {
  id: string;
  assetText: string;
  type: 'Headline' | 'Description' | 'Image';
  performance: 'Best' | 'Good' | 'Low';
  impressions: string;
  recommendation: 'Scale' | 'Retire' | 'Test';
}

// --- CLUSTER E: PMax Types ---

export interface PMaxChannelMetric {
  channel: 'Shopping' | 'Search' | 'Display' | 'YouTube' | 'Gmail' | 'Other';
  spend: string;
  roas: string;
  conversionValue: string;
  percentage: number;
  isInferred: boolean; // True if data is estimated via heuristics
}

export interface PMaxAlternative {
  pmaxCampaign: string;
  suggestedSplit: {
    searchStructure: string;
    shoppingStructure: string;
  };
  projectedEfficiencyGain: string;
}

// --- FULL REPORT ---

export interface GoogleAdsFullReport {
  dateRange: string;
  accountHealth: {
    optimizationScore: number;
    monthlyWaste: string;
    pmaxEfficiency: string;
    adStrength: string;
  };
  topPriorityActions: Array<{
    id: string;
    title: string;
    subtitle: string;
    impact: string;
    tab: GoogleAdsSubView;
  }>;
  clusterA: {
    negativeKeywords: NegativeKeywordOpportunity[];
    drift: SearchTermDrift[];
    lowPerf: LowPerfKeyword[];
  };
  clusterB: {
    waste: WasteMetric[];
    conversionHealth: ConversionHealth[];
    settingsAudit: SettingsAuditItem[];
  };
  clusterC: {
    bidStrategies: BidStrategyStatus[];
    budgetPacing: BudgetPacing[];
  };
  clusterD: {
    qualityScores: QualityScoreItem[];
    adAssets: AdAssetPerformance[];
  };
  clusterE: {
    pmaxBreakdown: PMaxChannelMetric[];
    alternatives: PMaxAlternative[];
  };
}

// --- Social Spark Types ---

export type SocialTone = 'Professional' | 'Edgy' | 'Funny';

export interface SocialDraft {
  id: string;
  productName: string;
  defaultCopy: string;
  images: string[]; // URLs or placeholders
}

export interface SocialIdea {
  id: string;
  category: 'Hook/Trend' | 'Educator/Technical' | 'Emotional/Fantasy' | 'Contrast/Why Us';
  title: string;
  description: string;
}

export enum SocialSparkView {
  INPUT = 'INPUT',
  IDEAS = 'IDEAS',
  CAPTION = 'CAPTION'
}