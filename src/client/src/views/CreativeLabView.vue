<script setup lang="ts">
import { ref, computed, watch, inject, type Ref } from 'vue';
import {
  Sparkles,
  RefreshCw,
  Wallet,
  Target,
  Facebook,
  Instagram,
  TrendingUp,
  Image as ImageIcon,
  AlertTriangle,
  Type,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Eye,
  MousePointerClick,
  DollarSign,
  ShoppingCart
} from 'lucide-vue-next';
import { useDateRange } from '../composables/useDateRange';
import type { MaxAccount } from '../types/account';

const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');
const { dateParams } = useDateRange();

const loading = ref(false);
const error = ref<string | null>(null);
const creatives = ref<any[]>([]);
const anomalies = ref<any[]>([]);
const textAdSort = ref<{ field: string; dir: 'asc' | 'desc' }>({ field: 'spend', dir: 'desc' });
const visualCollapsed = ref(false);
const textCollapsed = ref(false);

const fatigueMap = computed(() => {
  const map: Record<string, any> = {};
  anomalies.value.forEach(a => {
    if (a.monitor_id === 'creative_fatigue_monitor') {
      map[a.creative_id] = a;
    }
  });
  return map;
});

const visualCreatives = computed(() =>
  creatives.value.filter(c => c.thumbnail_url)
);

const textCreatives = computed(() => {
  const items = creatives.value.filter(c => !c.thumbnail_url);
  const { field, dir } = textAdSort.value;
  return [...items].sort((a, b) => {
    const av = a[field] ?? 0;
    const bv = b[field] ?? 0;
    return dir === 'desc' ? bv - av : av - bv;
  });
});

const toggleTextSort = (field: string) => {
  if (textAdSort.value.field === field) {
    textAdSort.value.dir = textAdSort.value.dir === 'desc' ? 'asc' : 'desc';
  } else {
    textAdSort.value = { field, dir: 'desc' };
  }
};

const loadAnomalies = async () => {
  if (!selectedAccount?.value) return;
  const acc = selectedAccount.value;
  const params = new URLSearchParams();
  const accountIds = [acc.id, acc.googleAdsId, acc.facebookAdsId].filter(Boolean) as string[];
  accountIds.forEach(id => params.append('accountId', id));
  params.append('monitorId', 'creative_fatigue_monitor');
  if (dateParams.value.startDate) params.append('startDate', dateParams.value.startDate);
  if (dateParams.value.endDate) params.append('endDate', dateParams.value.endDate);

  try {
    const res = await fetch(`/api/monitors/anomalies?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      anomalies.value = Array.isArray(data) ? data : (data.rows || []);
    }
  } catch (e) {
    console.warn('Failed to load fatigue anomalies', e);
  }
};

const loadCreatives = async () => {
  if (!selectedAccount?.value) return;

  loading.value = true;
  error.value = null;

  try {
    // Load both in parallel
    await Promise.all([loadAnomalies(), (async () => {
      const params = new URLSearchParams();
      const acc = selectedAccount.value;

      if (acc.id) params.append('accountId', acc.id);
      if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
      if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);

      params.append('start', dateParams.value.startDate || '');
      params.append('end', dateParams.value.endDate || '');
      params.append('grain', 'total');

      const res = await fetch(`/api/reports/creativePerformanceReport/live?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load creatives');

      const data = await res.json();
      creatives.value = Array.isArray(data) ? data : (data.rows || []);
    })()]);
  } catch (err) {
    console.error(err);
    error.value = 'Failed to load creative performance data.';
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

const formatPercent = (val: number) => `${((val || 0) * 100).toFixed(2)}%`;

const formatNumber = (val: number) => (val || 0).toLocaleString();

const getPlatformIcon = (platform: string) => {
  if (platform.toLowerCase().includes('google')) return Target;
  if (platform.toLowerCase().includes('facebook')) return Facebook;
  if (platform.toLowerCase().includes('instagram')) return Instagram;
  return Sparkles;
};

const getPlatformLabel = (platform: string) => {
  if (platform.toLowerCase().includes('google')) return 'Google Ads';
  if (platform.toLowerCase().includes('facebook')) return 'Meta Ads';
  if (platform.toLowerCase().includes('instagram')) return 'Instagram';
  return platform;
};

const getPlatformColor = (platform: string) => {
  if (platform.toLowerCase().includes('google')) return 'text-blue-600 bg-blue-50 border-blue-100';
  if (platform.toLowerCase().includes('facebook')) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
  return 'text-slate-600 bg-slate-50 border-slate-100';
};

watch([() => selectedAccount?.value, dateParams], () => {
  loadCreatives();
}, { immediate: true });

</script>

<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- Header -->
    <div class="bg-white border-b border-slate-200 pt-6 px-8 pb-6 sticky top-0 z-10 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles class="text-indigo-600" :size="28" />
            Creative Lab
          </h1>
          <p class="text-slate-500 text-sm mt-1">Cross-platform performance gallery for your ad assets.</p>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <button @click="loadCreatives" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors" title="Refresh">
            <RefreshCw :class="{'animate-spin': loading}" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-8 overflow-y-auto">
      <div v-if="loading" class="flex flex-col items-center justify-center h-64 text-slate-400">
        <RefreshCw class="w-10 h-10 mb-4 animate-spin text-indigo-300" />
        <p class="font-bold">Analyzing creative impact...</p>
      </div>

      <div v-else-if="error" class="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex flex-col items-center gap-4 max-w-md mx-auto mt-20">
        <p class="font-bold">{{ error }}</p>
        <button @click="loadCreatives" class="px-6 py-2 bg-white border border-red-200 rounded-xl text-red-600 font-bold hover:bg-red-50 transition-colors shadow-sm">Retry</button>
      </div>

      <div v-else-if="!creatives.length" class="flex flex-col items-center justify-center h-96 text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-300 max-w-4xl mx-auto mt-10 p-12 text-center">
        <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <ImageIcon class="text-slate-300" :size="40" />
        </div>
        <h3 class="text-xl font-bold text-slate-700">No creatives found</h3>
        <p class="text-slate-400 mt-2 max-w-sm">We couldn't find any ad creatives with activity for this period. Check your account connections or try a larger date range.</p>
      </div>

      <div v-else class="max-w-7xl mx-auto space-y-10">

        <!-- ═══════════════════════════════════════════ -->
        <!-- VISUAL CREATIVES SECTION                    -->
        <!-- ═══════════════════════════════════════════ -->
        <section v-if="visualCreatives.length">
          <button
            @click="visualCollapsed = !visualCollapsed"
            class="w-full flex items-center justify-between mb-6 group cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <ImageIcon class="text-white" :size="20" />
              </div>
              <div class="text-left">
                <h2 class="text-lg font-bold text-slate-900">Visual Creatives</h2>
                <p class="text-xs text-slate-400">{{ visualCreatives.length }} image &amp; video ads</p>
              </div>
            </div>
            <component :is="visualCollapsed ? ChevronDown : ChevronUp" class="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>

          <div v-show="!visualCollapsed" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <div
              v-for="creative in visualCreatives"
              :key="creative.creative_id"
              class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col"
            >
              <!-- Preview Area -->
              <div class="aspect-square relative bg-slate-100 overflow-hidden">
                <img
                  :src="creative.thumbnail_url"
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt="Ad Preview"
                />

                <!-- Platform Badge -->
                <div class="absolute top-4 left-4 flex flex-col gap-2">
                  <div class="bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-white/50">
                    <component :is="getPlatformIcon(creative.platform)" class="w-4 h-4" :class="creative.platform === 'google' ? 'text-blue-500' : 'text-indigo-600'" />
                  </div>

                  <!-- Fatigue Badge -->
                  <div v-if="fatigueMap[creative.creative_id]" class="bg-red-600 text-white p-2 rounded-xl shadow-lg border border-red-500 animate-pulse" title="Visual Fatigue Detected">
                    <AlertTriangle class="w-4 h-4" />
                  </div>
                </div>

                <!-- ROAS Overlay -->
                <div v-if="creative.roas > 0" class="absolute bottom-4 right-4">
                  <div class="bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-black shadow-lg text-sm flex items-center gap-1.5">
                    <TrendingUp :size="14" />
                    {{ creative.roas.toFixed(1) }}x
                  </div>
                </div>
              </div>

              <!-- Content Area -->
              <div class="p-6 flex-1 flex flex-col">
                <div class="mb-4">
                  <h4 class="font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors" :title="creative.creative_name">
                    {{ creative.creative_name || 'Untitled Creative' }}
                  </h4>
                  <p v-if="creative.title" class="text-xs text-slate-500 mt-1 line-clamp-2 italic">"{{ creative.title }}"</p>
                </div>

                <!-- Metrics Grid -->
                <div class="grid grid-cols-2 gap-4 mt-auto">
                  <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Spend</p>
                    <p class="text-sm font-black text-slate-800">{{ formatCurrency(creative.spend) }}</p>
                  </div>
                  <div class="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <p class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">CTR</p>
                    <p class="text-sm font-black text-indigo-900">{{ formatPercent(creative.ctr) }}</p>
                  </div>
                  <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
                    <p class="text-sm font-black text-slate-800">{{ formatCurrency(creative.revenue) }}</p>
                  </div>
                  <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Convs</p>
                    <p class="text-sm font-black text-slate-800">{{ formatNumber(creative.conversions) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════ -->
        <!-- TEXT ADS SECTION                            -->
        <!-- ═══════════════════════════════════════════ -->
        <section v-if="textCreatives.length">
          <button
            @click="textCollapsed = !textCollapsed"
            class="w-full flex items-center justify-between mb-6 group cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <Type class="text-white" :size="20" />
              </div>
              <div class="text-left">
                <h2 class="text-lg font-bold text-slate-900">Text &amp; Search Ads</h2>
                <p class="text-xs text-slate-400">{{ textCreatives.length }} text-based ads</p>
              </div>
            </div>
            <component :is="textCollapsed ? ChevronDown : ChevronUp" class="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>

          <div v-show="!textCollapsed" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-slate-100">
                    <th class="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Creative</th>
                    <th class="text-left px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Platform</th>
                    <th
                      v-for="col in [
                        { key: 'spend', label: 'Spend' },
                        { key: 'impressions', label: 'Impr.' },
                        { key: 'clicks', label: 'Clicks' },
                        { key: 'ctr', label: 'CTR' },
                        { key: 'conversions', label: 'Convs' },
                        { key: 'revenue', label: 'Revenue' },
                        { key: 'roas', label: 'ROAS' },
                      ]"
                      :key="col.key"
                      @click="toggleTextSort(col.key)"
                      class="text-right px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors select-none whitespace-nowrap"
                    >
                      <span class="inline-flex items-center gap-1">
                        {{ col.label }}
                        <ArrowUpDown v-if="textAdSort.field !== col.key" class="w-3 h-3 opacity-30" />
                        <ChevronUp v-else-if="textAdSort.dir === 'asc'" class="w-3 h-3 text-indigo-500" />
                        <ChevronDown v-else class="w-3 h-3 text-indigo-500" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="creative in textCreatives"
                    :key="creative.creative_id"
                    class="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group"
                  >
                    <td class="px-6 py-4 max-w-xs">
                      <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mt-0.5 group-hover:bg-indigo-50 transition-colors">
                          <Type class="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div class="min-w-0">
                          <p class="font-semibold text-sm text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors" :title="creative.creative_name">
                            {{ creative.creative_name || 'Untitled Ad' }}
                          </p>
                          <p v-if="creative.title" class="text-xs text-slate-400 mt-0.5 line-clamp-1 italic" :title="creative.title">
                            "{{ creative.title }}"
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border" :class="getPlatformColor(creative.platform)">
                        <component :is="getPlatformIcon(creative.platform)" class="w-3 h-3" />
                        {{ getPlatformLabel(creative.platform) }}
                      </span>
                    </td>
                    <td class="text-right px-4 py-4 text-sm font-semibold text-slate-800 tabular-nums">{{ formatCurrency(creative.spend) }}</td>
                    <td class="text-right px-4 py-4 text-sm text-slate-600 tabular-nums">{{ formatNumber(creative.impressions) }}</td>
                    <td class="text-right px-4 py-4 text-sm text-slate-600 tabular-nums">{{ formatNumber(creative.clicks) }}</td>
                    <td class="text-right px-4 py-4 text-sm text-slate-600 tabular-nums">{{ formatPercent(creative.ctr) }}</td>
                    <td class="text-right px-4 py-4 text-sm text-slate-600 tabular-nums">{{ formatNumber(creative.conversions) }}</td>
                    <td class="text-right px-4 py-4 text-sm font-semibold text-slate-800 tabular-nums">{{ formatCurrency(creative.revenue) }}</td>
                    <td class="text-right px-4 py-4">
                      <span
                        v-if="creative.roas > 0"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold"
                        :class="creative.roas >= 3 ? 'bg-emerald-50 text-emerald-700' : creative.roas >= 1 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'"
                      >
                        <TrendingUp :size="12" />
                        {{ creative.roas.toFixed(1) }}x
                      </span>
                      <span v-else class="text-xs text-slate-300">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
