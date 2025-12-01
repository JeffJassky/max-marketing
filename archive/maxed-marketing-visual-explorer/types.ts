export type Theme = 'focus' | 'executive';
export type View = 'dashboard' | 'brand-voice' | 'google-ads' | 'social-spark' | 'local-seo' | 'settings';

export interface DashboardMetric {
  label: string;
  value: string;
  change: number; // percentage
  trend: 'up' | 'down';
}

export interface ChartDataPoint {
  name: string;
  clicks: number;
  impressions: number;
}