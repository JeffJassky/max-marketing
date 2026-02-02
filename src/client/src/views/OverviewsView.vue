<script setup lang="ts">
import { ref, watch, inject, type Ref } from 'vue';
import {
  Layout,
  BarChart3,
  Globe,
  ShoppingBag,
  Instagram,
  Facebook,
  RefreshCw,
  Wallet,
  Search
} from 'lucide-vue-next';
import Sparkline from '../components/Sparkline.vue';
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

const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');
const { dateParams } = useDateRange();

const PlatformTab = {
  GOOGLE: 'GOOGLE',
  META: 'META',
  GA4: 'GA4',
  SHOPIFY: 'SHOPIFY',
  SOCIAL: 'SOCIAL',
  GSC: 'GSC'
} as const;

type PlatformTab = typeof PlatformTab[keyof typeof PlatformTab];

const tabs = [
  { id: PlatformTab.GOOGLE, label: 'Google Ads', icon: BarChart3, reportId: 'googleAdsCampaignPerformance' },
  { id: PlatformTab.META, label: 'Meta Ads', icon: Facebook, reportId: 'metaAdsCampaignPerformance' },
  { id: PlatformTab.GA4, label: 'Google Analytics', icon: Globe, reportId: 'ga4AcquisitionPerformance' },
  { id: PlatformTab.SHOPIFY, label: 'Shopify', icon: ShoppingBag, reportId: 'shopifySourcePerformance' },
  { id: PlatformTab.SOCIAL, label: 'Social', icon: Instagram, reportId: 'socialPlatformPerformance' },
  { id: PlatformTab.GSC, label: 'Search Console', icon: Search, reportId: 'gscQueryPerformance' }
];

const activeTab = ref<PlatformTab>(PlatformTab.GOOGLE);
const loading = ref(false);
const error = ref<string | null>(null);

interface ReportHeader {
  key: string;
  label: string;
  type: 'dimension' | 'metric' | 'rate' | 'sparkline';
  metric?: string; // For sparkline column
}

interface ReportData {
  headers: ReportHeader[];
  rows: any[];
  totals: Record<string, number>;
  dailyTotals: Record<string, number[]>;
}

const reportData = ref<ReportData>({ headers: [], rows: [], totals: {}, dailyTotals: {} });

const loadReport = async () => {
  if (!selectedAccount?.value) return;

  const currentTab = tabs.find(t => t.id === activeTab.value);
  if (!currentTab) return;

  loading.value = true;
  error.value = null;
  reportData.value = { headers: [], rows: [], totals: {}, dailyTotals: {} };

  try {
    const params = new URLSearchParams();
    
    // Account Params
    const acc = selectedAccount.value;
    if (acc.id) params.append('accountId', acc.id);
    if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
    if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);
    if (acc.ga4Id) params.append('ga4Id', acc.ga4Id);
    if (acc.shopifyId) params.append('shopifyId', acc.shopifyId);
    if (acc.instagramId) params.append('instagramId', acc.instagramId);
    if (acc.facebookPageId) params.append('facebookPageId', acc.facebookPageId);
    if (acc.gscId) params.append('gscId', acc.gscId);

    // Query Params
    params.append('start', dateParams.value.startDate || '');
    params.append('end', dateParams.value.endDate || '');
    params.append('grain', 'daily');

    const res = await fetch(`/api/reports/${currentTab.reportId}/live?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load report');
    
    const data = await res.json();
    // Handle both array (legacy fallback) and object formats
    if (Array.isArray(data)) {
        // Fallback or empty state
        reportData.value = { headers: [], rows: [], totals: {}, dailyTotals: {} };
    } else {
        reportData.value = data;
    }
  } catch (err) {
    console.error(err);
    error.value = 'Failed to load report data.';
  } finally {
    loading.value = false;
  }
};

const formatValue = (key: string, value: any) => {
  if (typeof value === 'number') {
    if (key.includes('rate') || key.includes('ctr') || key.includes('roas')) {
      return key.includes('roas') ? `${value.toFixed(2)}x` : `${(value * 100).toFixed(1)}%`;
    }
    if (key.includes('spend') || key.includes('revenue') || key.includes('cpa') || key.includes('aov') || key.includes('value')) {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return value.toLocaleString();
  }
  return value;
};

// Calculate Cumulative Sum for Summary Cards
const getCumulativeTotal = (key: string) => {
  const dailyValues = reportData.value.dailyTotals[key];
  if (!dailyValues) return [];

  const cumulative: number[] = [];
  let runningSum = 0;
  dailyValues.forEach(val => {
    runningSum += val;
    cumulative.push(runningSum);
  });
  return cumulative;
};

// Get Sparkline Data for Table Row (Daily Trend)
const getSparklineData = (row: any, metricKey?: string) => {
  if (!row._daily || !row._daily.length) return [];
  if (metricKey) {
      return row._daily.map((d: any) => d[metricKey] || 0);
  }
  return [];
};

watch([() => activeTab.value, () => selectedAccount?.value, dateParams], () => {
  loadReport();
}, { immediate: true });

</script>

<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- Header -->
    <div class="bg-white border-b border-slate-200 pt-6 px-4 md:px-8 sticky top-0 z-10 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center">
            <Layout class="w-8 h-8 mr-3 text-indigo-600" />
            Platform Overviews
          </h1>
          <p class="text-slate-500 text-sm mt-1">Unified performance metrics for your channels.</p>
        </div>
        
        <div class="flex items-center gap-3 flex-wrap">
          <button @click="loadReport" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors" title="Refresh">
            <RefreshCw :class="{'animate-spin': loading}" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex space-x-1 overflow-x-auto no-scrollbar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap min-w-[120px] justify-center"
          :class="activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'"
        >
          <component :is="tab.icon" class="w-4 h-4 mr-2" :class="activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-4 md:p-8 overflow-y-auto">
      <div v-if="loading" class="flex flex-col items-center justify-center h-64 text-slate-400">
        <RefreshCw class="w-8 h-8 mb-2 animate-spin text-indigo-300" />
        <p>Loading report data...</p>
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center h-64 text-red-400">
        <p>{{ error }}</p>
        <button @click="loadReport" class="mt-4 px-4 py-2 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50">Retry</button>
      </div>

      <div v-else-if="!reportData.rows.length" class="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
        <BarChart3 class="w-12 h-12 mb-2 text-slate-200" />
        <p>No data available for this period.</p>
        <p class="text-xs mt-1">Try selecting a different date range or account.</p>
      </div>

      <div v-else class="max-w-7xl mx-auto">
        <!-- Summary Cards (Top Row) -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
           <!-- Pick top 4 numeric metrics -->
           <div 
            v-for="header in reportData.headers.filter(h => h.type === 'metric' || h.type === 'rate').slice(0, 4)" 
            :key="header.key"
            class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
          >
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{{ header.label }}</p>
            <p class="text-2xl font-bold text-slate-900">
               {{ formatValue(header.key, reportData.totals[header.key]) }}
            </p>
            <!-- Cumulative Sparkline for Total -->
            <div class="mt-2 h-8 w-full">
               <Sparkline 
                :data="getCumulativeTotal(header.key)"
                :height="30"
                :width="200"
                color="#6366f1"
               />
            </div>
          </div>
        </div>

        <!-- Data Table -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 class="font-bold text-slate-800">Detailed Breakdown</h3>
            <span class="text-xs text-slate-500">{{ reportData.rows.length }} rows</span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
              <thead class="bg-slate-50">
                <tr>
                  <th 
                    v-for="header in reportData.headers" 
                    :key="header.key"
                    class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ header.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-slate-50">
                <tr v-for="(row, idx) in reportData.rows" :key="idx" class="hover:bg-slate-50 transition-colors">
                  <td 
                    v-for="header in reportData.headers" 
                    :key="header.key"
                    class="px-6 py-4 whitespace-nowrap text-sm text-slate-700"
                    :class="{'font-mono': header.type !== 'dimension' && header.type !== 'sparkline', 'font-medium': header.type === 'dimension'}"
                  >
                    <template v-if="header.type === 'sparkline'">
                      <Sparkline :data="getSparklineData(row, header.metric)" :width="100" :height="24" color="#818cf8" />
                    </template>
                    <template v-else>
                      {{ formatValue(header.key, row[header.key]) }}
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>