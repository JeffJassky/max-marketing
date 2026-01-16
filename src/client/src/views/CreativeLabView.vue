<script setup lang="ts">
import { ref, computed, watch, inject, type Ref } from 'vue';
import {
  Sparkles,
  Calendar,
  RefreshCw,
  Wallet,
  ChevronDown,
  BarChart3,
  ExternalLink,
  Target,
  Facebook,
  Instagram,
  MousePointer2,
  TrendingUp,
  Image as ImageIcon,
  AlertTriangle
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

const DateRanges = {
  LAST_30_DAYS: 'Last 30 Days',
  LAST_90_DAYS: 'Last 90 Days',
  THIS_MONTH: 'This Month',
  LAST_MONTH: 'Last Month'
} as const;

const selectedDateRange = ref<string>(DateRanges.LAST_30_DAYS);
const loading = ref(false);
const error = ref<string | null>(null);
const creatives = ref<any[]>([]);
const anomalies = ref<any[]>([]);

const fatigueMap = computed(() => {
  const map: Record<string, any> = {};
  anomalies.value.forEach(a => {
    if (a.monitor_id === 'creative_fatigue_monitor') {
      map[a.creative_id] = a;
    }
  });
  return map;
});

const getDateParams = () => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (selectedDateRange.value === DateRanges.THIS_MONTH) {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (selectedDateRange.value === DateRanges.LAST_MONTH) {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (selectedDateRange.value === DateRanges.LAST_30_DAYS) {
    start.setDate(now.getDate() - 30);
  } else if (selectedDateRange.value === DateRanges.LAST_90_DAYS) {
    start.setDate(now.getDate() - 90);
  }

  const today = new Date();
  if (end > today) end = today;

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};

const loadAnomalies = async () => {
  if (!selectedAccount?.value) return;
  const acc = selectedAccount.value;
  const params = new URLSearchParams();
  const accountIds = [acc.id, acc.googleAdsId, acc.facebookAdsId].filter(Boolean) as string[];
  accountIds.forEach(id => params.append('accountId', id));
  params.append('monitorId', 'creative_fatigue_monitor');

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
      const dates = getDateParams();
      const params = new URLSearchParams();
      const acc = selectedAccount.value;
      
      if (acc.id) params.append('accountId', acc.id);
      if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
      if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);
      
      params.append('start', dates.start);
      params.append('end', dates.end);
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
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const formatPercent = (val: number) => `${(val * 100).toFixed(2)}%`;

const getPlatformIcon = (platform: string) => {
  if (platform.toLowerCase().includes('google')) return Target;
  if (platform.toLowerCase().includes('facebook')) return Facebook;
  if (platform.toLowerCase().includes('instagram')) return Instagram;
  return Sparkles;
};

watch([() => selectedAccount?.value, selectedDateRange], () => {
  loadCreatives();
}, { immediate: true });

</script>

<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- Header -->
    <div class="bg-white border-b border-slate-200 pt-6 px-8 pb-6 sticky top-0 z-30 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles class="text-indigo-600" :size="28" />
            Creative Lab
          </h1>
          <p class="text-slate-500 text-sm mt-1">Cross-platform performance gallery for your ad assets.</p>
        </div>
        
        <div class="flex items-center gap-3 flex-wrap">
          <div class="relative group z-40">
            <button class="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
              <Calendar class="w-4 h-4 mr-2 text-slate-500" />
              {{ selectedDateRange }}
              <ChevronDown class="w-4 h-4 ml-2" />
            </button>
            <div class="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 hidden group-hover:block z-50 overflow-hidden">
              <button
                v-for="range in Object.values(DateRanges)"
                :key="range"
                class="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors"
                @click="selectedDateRange = range"
              >
                {{ range }}
              </button>
            </div>
          </div>

          <div v-if="selectedAccount" class="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-medium text-indigo-700 shadow-sm">
            <Wallet class="w-4 h-4 mr-3 text-indigo-500" />
            <div class="text-left leading-tight">
              <p class="text-[10px] uppercase text-indigo-400 font-bold tracking-wide">Active Account</p>
              <p class="text-sm font-bold text-indigo-900">{{ selectedAccount.name }}</p>
            </div>
          </div>
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

      <div v-else class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <div 
            v-for="creative in creatives" 
            :key="creative.creative_id" 
            class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col"
          >
            <!-- Preview Area -->
            <div class="aspect-square relative bg-slate-100 overflow-hidden">
              <img 
                v-if="creative.thumbnail_url" 
                :src="creative.thumbnail_url" 
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt="Ad Preview"
              />
              <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300 p-6">
                <ImageIcon :size="48" stroke-width="1" class="mb-2" />
                <p class="text-[10px] font-bold uppercase tracking-widest">{{ creative.platform }} ad</p>
              </div>
              
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
                <div class="bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-black shadow-lg text-sm flex items-center gap-1.5 animate-in slide-in-from-right-4 duration-500">
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
                  <p class="text-sm font-black text-slate-800">{{ creative.conversions.toLocaleString() }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
