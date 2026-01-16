import type { RouteRecordRaw } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import BrandVoiceView from '../views/BrandVoiceView.vue';
import GoogleAdsView from '../views/GoogleAdsView.vue';
import SocialSparkView from '../views/SocialSparkView.vue';
import SettingsView from '../views/SettingsView.vue';
import MonitorsView from '../views/MonitorsView.vue';
import SuperlativesView from '../views/SuperlativesView.vue';
import OverviewsView from '../views/OverviewsView.vue';
import ReportBuilderView from '../views/ReportBuilderView.vue';

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'dashboard', component: DashboardView },
  { path: '/overviews', name: 'overviews', component: OverviewsView },
  { path: '/report-builder', name: 'report-builder', component: ReportBuilderView },
  { path: '/monitors', name: 'monitors', component: MonitorsView },
  { path: '/superlatives', name: 'superlatives', component: SuperlativesView },
  { path: '/brand-voice', name: 'brand-voice', component: BrandVoiceView },
  { path: '/brand-voice/:channel', name: 'brand-voice-channel', component: BrandVoiceView },
  { path: '/google-ads', name: 'google-ads', component: GoogleAdsView },
  { path: '/social-spark', name: 'social-spark', component: SocialSparkView },
  { path: '/local-seo', name: 'local-seo', component: BrandVoiceView },
  { path: '/settings', name: 'settings', component: SettingsView }
];