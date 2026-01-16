<script setup lang="ts">
import { ref, computed, onMounted, watch, inject, type Ref } from 'vue';
import {
  Layout,
  BarChart3,
  Globe,
  ShoppingBag,
  Instagram,
  Facebook,
  ArrowUpRight,
  Calendar,
  RefreshCw,
  Wallet
} from 'lucide-vue-next';

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
  ga4Id: string | null;
  shopifyId: string | null;
  instagramId: string | null;
  facebookPageId: string | null;
}

const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');

const PlatformTab = {
  GOOGLE: 'GOOGLE',
  META: 'META',
  GA4: 'GA4',
  SHOPIFY: 'SHOPIFY',
  SOCIAL: 'SOCIAL'
} as const;

type PlatformTab = typeof PlatformTab[keyof typeof PlatformTab];

const tabs = [
  { id: PlatformTab.GOOGLE, label: 'Google Ads', icon: BarChart3, reportId: 'googleAdsCampaignPerformance' },
  { id: PlatformTab.META, label: 'Meta Ads', icon: Facebook, reportId: 'metaAdsCampaignPerformance' },
  { id: PlatformTab.GA4, label: 'Google Analytics', icon: Globe, reportId: 'ga4AcquisitionPerformance' },
  { id: PlatformTab.SHOPIFY, label: 'Shopify', icon: ShoppingBag, reportId: 'shopifySourcePerformance' },
  { id: PlatformTab.SOCIAL, label: 'Social', icon: Instagram, reportId: 'socialPlatformPerformance' }
];

const activeTab = ref<PlatformTab>(PlatformTab.GOOGLE);
const reportData = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Dynamic headers based on report type
const headers = computed(() => {
  if (!reportData.value.length) return [];
  
  // Exclude internal/metadata fields
  const excluded = ['account_id', 'report_id', 'detected_at', 'partition', 'cluster', 'rn'];
  return Object.keys(reportData.value[0])
    .filter(k => !excluded.includes(k))
    .map(k => ({
      key: k,
      label: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
});

const loadReport = async () => {
  if (!selectedAccount?.value) return;

  const currentTab = tabs.find(t => t.id === activeTab.value);
  if (!currentTab) return;

  loading.value = true;
  error.value = null;
  reportData.value = [];

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

    const res = await fetch(`/api/aggregateReports/${currentTab.reportId}?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load report');
    
    const data = await res.json();
    reportData.value = Array.isArray(data) ? data : [];
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
      return key.includes('roas') ? `${value.toFixed(2)}x` : `${(value * 100).toFixed(2)}%`;
    }
    if (key.includes('spend') || key.includes('revenue') || key.includes('cpa') || key.includes('aov') || key.includes('value')) {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return value.toLocaleString();
  }
  return value;
};

watch([() => activeTab.value, () => selectedAccount?.value], () => {
  loadReport();
}, { immediate: true });

</script>

<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- Header -->
    <div class="bg-white border-b border-slate-200 pt-6 px-4 md:px-8 sticky top-0 z-30 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center">
            <Layout class="w-8 h-8 mr-3 text-indigo-600" />
            Platform Overviews
          </h1>
          <p class="text-slate-500 text-sm mt-1">High-level performance snapshots per platform.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <div v-if="selectedAccount" class="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm font-medium text-indigo-700 shadow-sm">
            <Wallet class="w-4 h-4 mr-3 text-indigo-500" />
            <div class="text-left leading-tight">
              <p class="text-[10px] uppercase text-indigo-400 font-bold tracking-wide">Active Account</p>
              <p class="text-sm font-bold text-indigo-900">{{ selectedAccount.name }}</p>
            </div>
          </div>
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

      <div v-else-if="!reportData.length" class="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
        <BarChart3 class="w-12 h-12 mb-2 text-slate-200" />
        <p>No data available for this report.</p>
        <p class="text-xs mt-1">Check if the account is linked and data has been imported.</p>
      </div>

      <div v-else class="max-w-7xl mx-auto">
        <!-- Summary Cards (Top Row) -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
           <!-- Dynamically pick first 4 numeric metrics to show as cards -->
           <div 
            v-for="header in headers.filter(h => typeof reportData[0][h.key] === 'number').slice(0, 4)" 
            :key="header.key"
            class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
          >
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{{ header.label }}</p>
            <p class="text-2xl font-bold text-slate-900">
               {{ formatValue(header.key, reportData.reduce((acc, row) => acc + (row[header.key] || 0), 0)) }}
               <span v-if="header.key.includes('rate') || header.key.includes('roas') || header.key.includes('ctr')" class="text-xs font-normal text-slate-400 ml-1">(Avg/Sum)</span>
            </p>
          </div>
        </div>

        <!-- Data Table -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 class="font-bold text-slate-800">Detailed Breakdown</h3>
            <span class="text-xs text-slate-500">{{ reportData.length }} rows</span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
              <thead class="bg-slate-50">
                <tr>
                  <th 
                    v-for="header in headers" 
                    :key="header.key"
                    class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ header.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-slate-50">
                <tr v-for="(row, idx) in reportData" :key="idx" class="hover:bg-slate-50 transition-colors">
                  <td 
                    v-for="header in headers" 
                    :key="header.key"
                    class="px-6 py-4 whitespace-nowrap text-sm text-slate-700"
                    :class="typeof row[header.key] === 'number' ? 'font-mono' : 'font-medium'"
                  >
                    {{ formatValue(header.key, row[header.key]) }}
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
