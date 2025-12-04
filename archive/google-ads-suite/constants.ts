import { InsightCardData, CustomerProfile } from './types';

export const CUSTOMER_PROFILE: CustomerProfile = {
  name: "George's Music",
  locations: ["Philadelphia, PA", "Jacksonville, FL"],
  primaryVertical: "Musical Instrument Retail"
};

export const INSIGHTS_DATA: InsightCardData[] = [
  {
    id: 'waste-001',
    type: 'WASTE',
    category: 'Google Ads',
    title: 'Google Ads Waste Detected',
    description: 'We found that the keyword "cheap electric guitars" is driving traffic but resulting in zero sales. Users are bouncing because your inventory focuses on premium brands like Fender and Gibson.',
    impactLabel: 'Save $420/mo',
    metrics: [
      { label: 'Spend (30d)', value: '$420.50', color: 'text-red-600' },
      { label: 'Bounce Rate', value: '92%', trend: 'up', trendValue: '+15%' },
      { label: 'ROAS', value: '0.0x', color: 'text-red-600' }
    ],
    actionLabel: 'Block this Word'
  },
  {
    id: 'social-001',
    type: 'OPPORTUNITY',
    category: 'Social Spark',
    title: 'New Launch: Signature Snare',
    description: 'A new Ludwig Signature Series Snare Drum just arrived in inventory. We have drafted a post to highlight its limited availability for your drummer audience.',
    impactLabel: 'Engagement Boost',
    metrics: [
      { label: 'Est. Reach', value: '2.5k' },
      { label: 'Inventory', value: '5 Units' }
    ],
    predictedEngagement: {
      reach: '20K',
      traffic: '800',
      revenue: '$5,000'
    },
    actionLabel: 'Review Draft'
  }
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', locked: false },
  { id: 'google_ads', label: 'Google Ads Suite', icon: 'BarChart3', locked: false },
  { id: 'social_spark', label: 'Social Spark', icon: 'Sparkles', locked: true },
  { id: 'local_seo', label: 'Local SEO', icon: 'MapPin', locked: true },
  { id: 'settings', label: 'Settings', icon: 'Settings', locked: false },
];