<script setup lang="ts">
import { ref, watch, inject, type Ref, computed } from 'vue';
import { TrendingUp, TrendingDown, Megaphone, Users, Search } from 'lucide-vue-next';
import Sparkline from './Sparkline.vue';
import { useDateRange } from '../composables/useDateRange';

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
  ga4Id: string | null;
  shopifyId: string | null;
  instagramId: string | null;
  facebookPageId: string | null;
  gscId: string | null;
}

interface MetricData {
  value: number | null;
  change: number | null;
  daily?: number[];
}

interface SectionData {
  platforms: string[];
  metrics: Record<string, MetricData>;
}

interface UnifiedData {
  paidMedia: SectionData;
  organicSocial: SectionData;
  searchAndSite: SectionData;
  period: { start: string; end: string };
}

const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');
const { dateParams } = useDateRange();

const loading = ref(false);
const error = ref<string | null>(null);
const data = ref<UnifiedData | null>(null);

const loadData = async () => {
  if (!selectedAccount?.value) return;

  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    const acc = selectedAccount.value;
    if (acc.id) params.append('accountId', acc.id);
    if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
    if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);
    if (acc.ga4Id) params.append('ga4Id', acc.ga4Id);
    if (acc.shopifyId) params.append('shopifyId', acc.shopifyId);
    if (acc.instagramId) params.append('instagramId', acc.instagramId);
    if (acc.facebookPageId) params.append('facebookPageId', acc.facebookPageId);
    if (acc.gscId) params.append('gscId', acc.gscId);
    params.append('start', dateParams.value.startDate || '');
    params.append('end', dateParams.value.endDate || '');

    const res = await fetch(`/api/overview/unified?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load unified overview');
    data.value = await res.json();
  } catch (err) {
    console.error(err);
    error.value = 'Failed to load overview data.';
  } finally {
    loading.value = false;
  }
};

watch([() => selectedAccount?.value, dateParams], () => {
  loadData();
}, { immediate: true });

const getCumulative = (daily: number[]) => {
  const cumulative: number[] = [];
  let sum = 0;
  daily.forEach(val => {
    sum += val;
    cumulative.push(sum);
  });
  return cumulative;
};

const formatValue = (key: string, value: number | null) => {
  if (value === null) return 'N/A';
  if (key === 'spend' || key === 'blendedCPC') {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (key === 'engagementRate') {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const metricLabels: Record<string, string> = {
  spend: 'Ad Spend',
  conversions: 'Conversions',
  impressions: 'Impressions',
  clicks: 'Clicks',
  blendedCPC: 'Blended CPC',
  reach: 'Reach',
  engagement: 'Engagement',
  engagementRate: 'Engagement Rate',
  followers: 'Total Followers',
  searchImpressions: 'Search Impressions',
  searchClicks: 'Search Clicks',
  organicSessions: 'Organic Sessions',
  totalSessions: 'Total Sessions',
};

// Section configs for rendering
const sections = computed(() => {
  if (!data.value) return [];

  const result = [];

  if (data.value.paidMedia.platforms.length > 0) {
    result.push({
      key: 'paidMedia',
      label: 'Paid Media',
      icon: Megaphone,
      platforms: data.value.paidMedia.platforms,
      heroMetrics: ['spend', 'conversions'],
      supportMetrics: ['impressions', 'clicks', 'blendedCPC'],
      data: data.value.paidMedia.metrics,
      gridClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    });
  }

  if (data.value.organicSocial.platforms.length > 0) {
    result.push({
      key: 'organicSocial',
      label: 'Organic Social',
      icon: Users,
      platforms: data.value.organicSocial.platforms,
      heroMetrics: ['reach', 'engagement'],
      supportMetrics: ['followers', 'engagementRate'],
      data: data.value.organicSocial.metrics,
      gridClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    });
  }

  if (data.value.searchAndSite.platforms.length > 0) {
    result.push({
      key: 'searchAndSite',
      label: 'Search & Site',
      icon: Search,
      platforms: data.value.searchAndSite.platforms,
      heroMetrics: ['searchImpressions', 'totalSessions'],
      supportMetrics: ['searchClicks', 'organicSessions'],
      data: data.value.searchAndSite.metrics,
      gridClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    });
  }

  return result;
});
</script>

<template>
  <div class="py-6 px-4 md:px-8 space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div v-for="i in 3" :key="i" class="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-40 mb-6"></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div v-for="j in 5" :key="j" class="space-y-3">
            <div class="h-3 bg-slate-200 rounded w-20"></div>
            <div class="h-7 bg-slate-200 rounded w-28"></div>
            <div class="h-8 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-slate-500">{{ error }}</p>
      <button
        @click="loadData"
        class="mt-4 px-4 py-2 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
      >
        Retry
      </button>
    </div>

    <!-- No data -->
    <div v-else-if="!data || sections.length === 0" class="text-center py-12">
      <p class="text-slate-500">No platforms connected for this account.</p>
      <p class="text-xs text-slate-400 mt-1">Connect a platform to see your unified overview.</p>
    </div>

    <!-- Section Rows -->
    <template v-else>
      <div
        v-for="section in sections"
        :key="section.key"
        class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <!-- Section Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <component :is="section.icon" class="w-5 h-5 text-slate-400" />
          <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wide">{{ section.label }}</h3>
          <div class="flex items-center gap-1.5 ml-2">
            <span
              v-for="platform in section.platforms"
              :key="platform"
              class="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"
            >
              {{ platform }}
            </span>
          </div>
        </div>

        <!-- Metric Cards Grid -->
        <div class="p-6">
          <div class="grid gap-4" :class="section.gridClass">
            <!-- Hero Cards -->
            <div
              v-for="metricKey in section.heroMetrics"
              :key="metricKey"
              class="p-5 rounded-lg border border-slate-100 bg-slate-50/50"
              :class="{ 'lg:col-span-1': true }"
            >
              <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                {{ metricLabels[metricKey] || metricKey }}
              </p>
              <div class="flex items-baseline gap-3">
                <p class="text-2xl font-bold text-slate-900">
                  {{ section.data[metricKey] ? formatValue(metricKey, section.data[metricKey].value) : '—' }}
                </p>
                <span
                  v-if="section.data[metricKey] && section.data[metricKey].change !== null"
                  class="text-xs font-medium px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5"
                  :class="section.data[metricKey].change >= 0
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-red-700 bg-red-50'"
                >
                  <TrendingUp v-if="section.data[metricKey].change >= 0" class="w-3 h-3" />
                  <TrendingDown v-else class="w-3 h-3" />
                  {{ section.data[metricKey].change >= 0 ? '+' : '' }}{{ section.data[metricKey].change.toFixed(1) }}%
                </span>
              </div>
              <!-- Sparkline -->
              <div
                v-if="section.data[metricKey]?.daily?.length"
                class="mt-3 h-10"
              >
                <Sparkline :data="getCumulative(section.data[metricKey].daily)" color="#6366f1" />
              </div>
            </div>

            <!-- Supporting Cards -->
            <div
              v-for="metricKey in section.supportMetrics"
              :key="metricKey"
              class="p-4 rounded-lg border border-slate-100 bg-white"
            >
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                {{ metricLabels[metricKey] || metricKey }}
              </p>
              <div class="flex items-baseline gap-2">
                <p class="text-lg font-bold text-slate-900">
                  {{ section.data[metricKey] ? formatValue(metricKey, section.data[metricKey].value) : '—' }}
                </p>
                <span
                  v-if="section.data[metricKey] && section.data[metricKey].change !== null"
                  class="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                  :class="section.data[metricKey].change >= 0
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-red-700 bg-red-50'"
                >
                  {{ section.data[metricKey].change >= 0 ? '+' : '' }}{{ section.data[metricKey].change.toFixed(1) }}%
                </span>
              </div>
              <!-- Small sparkline for supporting cards -->
              <div
                v-if="section.data[metricKey]?.daily?.length"
                class="mt-2 h-6"
              >
                <Sparkline :data="getCumulative(section.data[metricKey].daily)" color="#94a3b8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
