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
  OPPORTUNITIES = 'OPPORTUNITIES',
  WASTE_WATCH = 'WASTE_WATCH',
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
}

export interface RoadmapTask {
  id: string;
  label: string;
  subLabel: string;
  completed: boolean;
  month: 1 | 2;
}

// --- New Cluster A Types ---

export interface LowPerfKeyword {
  id: string;
  keyword: string;
  spend: string;
  ctr: string;
  qualityScore: string; // e.g., "3/10"
}

export interface SearchTermDrift {
  id: string;
  campaignName: string;
  goodTerm: {
    term: string;
    metricLabel: string;
    metricValue: string;
  };
  driftingTerm: {
    term: string;
    metricLabel: string;
    metricValue: string;
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