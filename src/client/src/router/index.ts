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
import CreativeLabView from '../views/CreativeLabView.vue';
import LoginView from '../views/LoginView.vue';
import ForgotPasswordView from '../views/ForgotPasswordView.vue';
import ResetPasswordView from '../views/ResetPasswordView.vue';
import AdminView from '../views/AdminView.vue';
import SecurityView from '../views/SecurityView.vue';
import PrivacyView from '../views/PrivacyView.vue';

export const routes: RouteRecordRaw[] = [
  // Public auth routes
  { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
  { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView, meta: { public: true } },
  { path: '/reset-password', name: 'reset-password', component: ResetPasswordView, meta: { public: true } },
  { path: '/security', name: 'security', component: SecurityView, meta: { public: true, publicAlways: true } },
  { path: '/privacy', name: 'privacy', component: PrivacyView, meta: { public: true, publicAlways: true } },

  // Protected routes
  { path: '/', name: 'dashboard', component: DashboardView },
  { path: '/overviews', name: 'overviews', component: OverviewsView },
  { path: '/report-builder', name: 'report-builder', component: ReportBuilderView },
  { path: '/creative-lab', name: 'creative-lab', component: CreativeLabView },
  { path: '/monitors', name: 'monitors', component: MonitorsView },
  { path: '/superlatives', name: 'superlatives', component: SuperlativesView },
  { path: '/brand-voice', name: 'brand-voice', component: BrandVoiceView },
  { path: '/brand-voice/:channel', name: 'brand-voice-channel', component: BrandVoiceView },
  { path: '/google-ads', name: 'google-ads', component: GoogleAdsView },
  { path: '/social-spark', name: 'social-spark', component: SocialSparkView },
  { path: '/local-seo', name: 'local-seo', component: BrandVoiceView },
  { path: '/settings', name: 'settings', component: SettingsView },

  // Admin routes
  { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAdmin: true } }
];
