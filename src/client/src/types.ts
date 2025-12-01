export type Theme = 'focus' | 'executive';
export type View = 'dashboard' | 'brand-voice' | 'google-ads' | 'social-spark' | 'local-seo' | 'settings';

export interface DashboardMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
}

export interface ChartDataPoint {
  name: string;
  actions: number;
  value: number;
}
