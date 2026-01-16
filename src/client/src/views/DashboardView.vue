<script setup lang="ts">
import { computed, ref, onMounted, watch, inject, type Ref } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import { useRouter } from 'vue-router';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowRight, 
  LayoutGrid, 
  Sparkles, 
  Target, 
  Zap, 
  Wallet, 
  BarChart3, 
  AlertCircle,
  Clock,
  TrendingDown,
  ArrowDownRight,
  Globe,
  ShoppingBag,
  MessageSquare,
  X
} from 'lucide-vue-next';
import 'deep-chat';

const router = useRouter();
const ApexChart = VueApexCharts;

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
  ga4Id: string | null;
  shopifyId: string | null;
}

interface SpendSegment {
  id: string;
  label: string;
  value: number;
  percent: number;
  relativePercent: number;
  color: string;
  platform: 'Google' | 'Meta';
  roas: number;
}

// Global Account State injected from layout
const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');

const timeRange = ref<'lifetime' | 'ytd' | '90d'>('90d');

// Chat State
const showChat = ref(false);
const chatContext = computed(() => {
  if (!selectedAccount?.value) return {};
  const acc = selectedAccount.value;
  return {
    accountId: acc.id,
    googleAdsId: acc.googleAdsId,
    facebookAdsId: acc.facebookAdsId,
    ga4Id: acc.ga4Id,
    shopifyId: acc.shopifyId
  };
});

// Real Data State
const scorecard = ref<any>(null);
const anomalies = ref<any[]>([]);
const spendDataLoading = ref(false);
const scorecardLoading = ref(false);
const anomaliesLoading = ref(false);

const googleSegments = ref<SpendSegment[]>([]);
const metaSegments = ref<SpendSegment[]>([]);
const grandTotal = ref(0);
const googleTotal = ref(0);
const metaTotal = ref(0);
const hoveredSegmentId = ref<string | null>(null);

const formatCurrency = (value: number) =>
  `$${(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatRoas = (value: number) =>
  value > 0 ? `${value.toFixed(1)}x` : '—';

const loadScorecard = async () => {
  if (!selectedAccount?.value) return;
  const acc = selectedAccount.value;
  const params = new URLSearchParams();
  if (acc.id) params.append('accountId', acc.id);
  if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
  if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);
  if (acc.ga4Id) params.append('ga4Id', acc.ga4Id);
  if (acc.shopifyId) params.append('shopifyId', acc.shopifyId);
  if (acc.instagramId) params.append('instagramId', acc.instagramId);
  if (acc.facebookPageId) params.append('facebookPageId', acc.facebookPageId);
  params.append('days', timeRange.value === '90d' ? '90' : '30');

  scorecardLoading.value = true;
  try {
    const res = await fetch(`/api/executive/summary?${params.toString()}`);
    scorecard.value = await res.json();
  } catch (e) {
    console.error('Failed to load scorecard', e);
  } finally {
    scorecardLoading.value = false;
  }
};

const loadAnomalies = async () => {
  if (!selectedAccount?.value) return;
  const acc = selectedAccount.value;
  const params = new URLSearchParams();
  if (acc.id) params.append('accountId', acc.id);
  if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
  if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);
  if (acc.ga4Id) params.append('ga4Id', acc.ga4Id);
  if (acc.shopifyId) params.append('shopifyId', acc.shopifyId);
  if (acc.instagramId) params.append('instagramId', acc.instagramId);
  if (acc.facebookPageId) params.append('facebookPageId', acc.facebookPageId);
  
  anomaliesLoading.value = true;
  try {
    const res = await fetch(`/api/monitors/anomalies?${params.toString()}`);
    const data = await res.json();
    anomalies.value = Array.isArray(data) ? data : (data.rows || []);
  } catch (e) {
    console.error('Failed to load anomalies', e);
  } finally {
    anomaliesLoading.value = false;
  }
};

const loadSpendData = async () => {
  if (!selectedAccount?.value) {
    resetSpend();
    return;
  }

  const { id, googleAdsId, facebookAdsId, ga4Id, shopifyId, instagramId, facebookPageId } = selectedAccount.value;
  
  spendDataLoading.value = true;
  try {
    const params = new URLSearchParams();
    if (id) params.append('accountId', id);
    if (googleAdsId) params.append('googleAdsId', googleAdsId);
    if (facebookAdsId) params.append('facebookAdsId', facebookAdsId);
    if (ga4Id) params.append('ga4Id', ga4Id);
    if (shopifyId) params.append('shopifyId', shopifyId);
    if (instagramId) params.append('instagramId', instagramId);
    if (facebookPageId) params.append('facebookPageId', facebookPageId);

    const response = await fetch(`/api/aggregateReports/adsSpendBreakdown?${params.toString()}`);
    const data = await response.json();
    
    // The generic endpoint might return { rows, totals } or just rows
    const rows: any[] = Array.isArray(data) ? data : (data.rows || []);

    if (!rows.length) {
      console.warn('Spend data response is empty or invalid format:', data);
      resetSpend();
      return;
    }

    let totalG = 0;
    let totalM = 0;
    const gSegs: SpendSegment[] = [];
    const mSegs: SpendSegment[] = [];

    const googleCatColors = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#1a73e8'];
    const metaCatColors = ['#0668E1', '#833AB4', '#E1306C', '#C13584', '#FD1D1D'];

    rows.forEach((item: any, idx: number) => {
      const val = Number(item.spend) || 0;
      if (val > 0) {
        if (item.platform === 'google') {
          totalG += val;
          gSegs.push({
            id: `g-${idx}`,
            label: item.channel_group,
            value: val,
            percent: 0,
            relativePercent: 0,
            color: googleCatColors[gSegs.length % googleCatColors.length],
            platform: 'Google',
            roas: Number(item.roas) || 0
          });
        } else {
          totalM += val;
          mSegs.push({
            id: `m-${idx}`,
            label: item.channel_group,
            value: val,
            percent: 0,
            relativePercent: 0,
            color: metaCatColors[mSegs.length % metaCatColors.length],
            platform: 'Meta',
            roas: Number(item.roas) || 0
          });
        }
      }
    });

    const total = totalG + totalM;
    if (total > 0) {
      gSegs.forEach(s => { s.percent = (s.value / total) * 100; s.relativePercent = (s.value / totalG) * 100; });
      mSegs.forEach(s => { s.percent = (s.value / total) * 100; s.relativePercent = (s.value / totalM) * 100; });
    }

    grandTotal.value = total;
    googleTotal.value = totalG;
    metaTotal.value = totalM;
    googleSegments.value = gSegs.sort((a, b) => b.value - a.value);
    metaSegments.value = mSegs.sort((a, b) => b.value - a.value);
  } catch (e) {
    console.error(e);
    resetSpend();
  } finally {
    spendDataLoading.value = false;
  }
};

const resetSpend = () => {
  grandTotal.value = 0; googleTotal.value = 0; metaTotal.value = 0;
  googleSegments.value = []; metaSegments.value = [];
};

const googleWidth = computed(() => grandTotal.value > 0 ? (googleTotal.value / grandTotal.value) * 100 : 0);
const metaWidth = computed(() => grandTotal.value > 0 ? (metaTotal.value / grandTotal.value) * 100 : 0);

const googleAvgRoas = computed(() => {
  if (googleTotal.value === 0) return 0;
  return googleSegments.value.reduce((acc, s) => acc + (s.value * s.roas), 0) / googleTotal.value;
});

const metaAvgRoas = computed(() => {
  if (metaTotal.value === 0) return 0;
  return metaSegments.value.reduce((acc, s) => acc + (s.value * s.roas), 0) / metaTotal.value;
});

// Dynamic Health Scoring
const platformHealth = computed(() => {
  const scores = { google: 100, meta: 100, ga4: 100, shopify: 100 };
  
  anomalies.value.forEach(a => {
    let deduction = 10;
    if (a.impact?.multiplier > 1) deduction = 20;
    if (a.monitor_id.includes('drift')) deduction = 5;

    const mid = a.monitor_id.toLowerCase();
    const platform = a.platform?.toLowerCase();

    if (mid.includes('google') || mid.includes('pmax') || mid.includes('keyword') || platform === 'google') {
      scores.google -= deduction;
    } else if (mid.includes('meta') || mid.includes('facebook') || platform === 'facebook' || platform === 'meta') {
      scores.meta -= deduction;
    } else if (mid.includes('ga4')) {
      scores.ga4 -= deduction;
    } else if (mid.includes('shopify')) {
      scores.shopify -= deduction;
    }
  });

  return {
    google: Math.max(0, scores.google),
    meta: Math.max(0, scores.meta),
    ga4: Math.max(0, scores.ga4),
    shopify: Math.max(0, scores.shopify)
  };
});

// Momentum Chart Mock (Still mock for now as we need time series for MER)
const focusChartOptions = computed(() => ({
  chart: { type: 'line', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
  stroke: { width: [0, 3], curve: 'smooth' },
  colors: ['#c3fd34', '#7c3aed'],
  xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], labels: { style: { colors: '#94a3b8' } } },
  yaxis: [{ title: { text: 'Impact' } }, { opposite: true, title: { text: 'MER' } }],
  legend: { show: false },
}));

const focusSeries = computed(() => [
  { name: 'Actions', type: 'column', data: [4, 6, 8, 5, 12, 9] },
  { name: 'MER', type: 'line', data: [3.2, 3.5, 3.1, 4.0, 4.2, 3.8] }
]);

const loadAll = () => {
  loadScorecard();
  loadSpendData();
  loadAnomalies();
};

onMounted(() => loadAll());
watch(() => selectedAccount?.value, () => loadAll(), { immediate: true });
watch(timeRange, () => loadScorecard());

</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
    <section class="p-8 font-sans animate-in fade-in duration-500 overflow-y-auto h-full pb-20">
      
      <!-- Welcome Header -->
      <div class="mb-8 flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold text-slate-800">
            {{ selectedAccount ? `Ready to win, ${selectedAccount.name}?` : 'Welcome to Maxed' }}
          </h1>
          <p class="text-slate-500 mt-1 max-w-2xl" v-if="scorecard">
            Holistic MER is currently 
            <span class="font-bold text-indigo-600">{{ scorecard.scorecard.mer.value.toFixed(2) }}x</span>.
            We found <span class="font-bold text-slate-800">{{ anomalies.length }} optimization opportunities</span> for you today.
          </p>
        </div>
        <div class="text-[10px] text-indigo-400 font-mono">DASHBOARD_V1_LIVE</div>
      </div>

      <!-- Executive Scorecard -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" v-if="scorecard">
        <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
          <div class="flex justify-between items-start mb-4">
            <span class="text-slate-500 text-sm font-medium uppercase tracking-wider">Holistic MER</span>
            <TrendingUp class="w-5 h-5 text-indigo-500" />
          </div>
          <div class="text-4xl font-black text-slate-900 mb-2">{{ scorecard.scorecard.mer.value.toFixed(2) }}x</div>
          <div class="flex items-center gap-1 text-xs" :class="scorecard.scorecard.mer.change >= 0 ? 'text-green-600' : 'text-red-600'">
            <component :is="scorecard.scorecard.mer.change >= 0 ? ArrowUpRight : ArrowDownRight" size="14" />
            <span class="font-bold">{{ Math.abs(scorecard.scorecard.mer.change).toFixed(1) }}%</span>
            <span class="text-slate-400 font-normal ml-1">vs prev. period</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
          <div class="flex justify-between items-start mb-4">
            <span class="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Ad Spend</span>
            <Wallet class="w-5 h-5 text-red-400" />
          </div>
          <div class="text-4xl font-black text-slate-900 mb-2">{{ formatCurrency(scorecard.scorecard.spend.value) }}</div>
          <div class="flex items-center gap-1 text-xs" :class="scorecard.scorecard.spend.change <= 0 ? 'text-green-600' : 'text-slate-500'">
            <span class="font-bold">{{ scorecard.scorecard.spend.change.toFixed(1) }}%</span>
            <span class="text-slate-400 font-normal ml-1">spend velocity</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
          <div class="flex justify-between items-start mb-4">
            <span class="text-slate-500 text-sm font-medium uppercase tracking-wider">Store Revenue</span>
            <ShoppingBag class="w-5 h-5 text-green-500" />
          </div>
          <div class="text-4xl font-black text-slate-900 mb-2">{{ formatCurrency(scorecard.scorecard.revenue.value) }}</div>
          <div class="flex items-center gap-1 text-xs" :class="scorecard.scorecard.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'">
            <component :is="scorecard.scorecard.revenue.change >= 0 ? ArrowUpRight : ArrowDownRight" size="14" />
            <span class="font-bold">{{ Math.abs(scorecard.scorecard.revenue.change).toFixed(1) }}%</span>
            <span class="text-slate-400 font-normal ml-1">growth</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
          <div class="flex justify-between items-start mb-4">
            <span class="text-slate-500 text-sm font-medium uppercase tracking-wider">Acquisition Health</span>
            <Sparkles class="w-5 h-5 text-amber-500" />
          </div>
          <div class="text-4xl font-black text-slate-900 mb-2">{{ scorecard.scorecard.acquisition.value.toFixed(0) }}%</div>
          <div class="flex items-center gap-1 text-xs" :class="scorecard.scorecard.acquisition.change >= 0 ? 'text-green-600' : 'text-slate-500'">
            <component :is="scorecard.scorecard.acquisition.change >= 0 ? ArrowUpRight : ArrowDownRight" size="14" />
            <span class="font-bold">{{ Math.abs(scorecard.scorecard.acquisition.change).toFixed(1) }}%</span>
            <span class="text-slate-400 font-normal ml-1">new customer rev.</span>
          </div>
        </div>
      </div>

      <!-- Spend Breakdown -->
      <div class="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm mb-8">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 :size="24" class="text-indigo-500" />
              Marketing Mix
            </h3>
            <p class="text-sm text-slate-400">Holistic allocation across search and social channels.</p>
          </div>
          <div class="flex bg-stone-100 p-1 rounded-xl">
            <button @click="timeRange = '90d'" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all" :class="timeRange === '90d' ? 'bg-white shadow-sm' : 'text-slate-500'">90 Days</button>
            <button @click="timeRange = 'ytd'" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all" :class="timeRange === 'ytd' ? 'bg-white shadow-sm' : 'text-slate-500'">30 Days</button>
          </div>
        </div>

        <div v-if="spendDataLoading" class="py-20 flex justify-center"><RefreshCw class="animate-spin text-indigo-200" :size="40" /></div>
        <div v-else-if="grandTotal === 0" class="py-20 text-center text-slate-300 italic">Connect your ad accounts to see spend breakdown.</div>
        
        <template v-else>
          <div class="w-full flex h-12 mb-12 rounded-2xl overflow-hidden shadow-inner border border-slate-100">
            <div v-for="s in googleSegments" :key="s.id" :style="{ width: `${s.percent}%`, backgroundColor: s.color }" class="h-full border-r border-white/10 last:border-0 relative group">
               <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {{ s.label }}: {{ formatCurrency(s.value) }}
              </div>
            </div>
            <div v-for="s in metaSegments" :key="s.id" :style="{ width: `${s.percent}%`, backgroundColor: s.color }" class="h-full border-r border-white/10 last:border-0 relative group">
               <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {{ s.label }}: {{ formatCurrency(s.value) }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div class="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Target size="14" class="text-blue-500" /> Google Ads</span>
                <span class="text-sm font-black text-slate-700">{{ formatCurrency(googleTotal) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="s in googleSegments" :key="s.id" class="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-600 truncate mr-2">{{ s.label }}</span>
                  <span class="text-xs font-mono text-slate-400">{{ s.relativePercent.toFixed(0) }}%</span>
                </div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Facebook size="14" class="text-indigo-600" /> Meta Ads</span>
                <span class="text-sm font-black text-slate-700">{{ formatCurrency(metaTotal) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="s in metaSegments" :key="s.id" class="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-600 truncate mr-2">{{ s.label }}</span>
                  <span class="text-xs font-mono text-slate-400">{{ s.relativePercent.toFixed(0) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Feed & Priorities -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Priority Feed -->
        <div class="lg:col-span-2 space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-slate-800">Priority Focus</h3>
            <button @click="router.push('/monitors')" class="text-xs font-bold text-indigo-600 hover:underline">View All Monitors</button>
          </div>

          <div v-if="anomaliesLoading" class="py-10 flex justify-center"><RefreshCw class="animate-spin text-slate-200" /></div>
          
          <div v-else-if="anomalies.length === 0" class="p-12 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center">
            <CheckCircle class="mx-auto mb-4 text-green-400" :size="40" />
            <p class="font-bold text-slate-700">All systems optimized</p>
            <p class="text-sm text-slate-400 mt-1">We'll alert you here when new high-impact actions are found.</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="anomaly in anomalies.slice(0, 5)" :key="anomaly.id" class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-all group cursor-pointer" @click="router.push('/monitors')">
              <div class="flex justify-between items-start">
                <div class="flex gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <AlertCircle v-if="anomaly.monitor_id.includes('drop')" />
                    <TrendingDown v-else-if="anomaly.monitor_id.includes('spend')" />
                    <Sparkles v-else />
                  </div>
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-red-50 text-red-600" v-if="anomaly.impact?.multiplier > 1">High Impact</span>
                      <span class="text-xs font-bold text-slate-400">{{ anomaly.monitor_id.replace(/_/g, ' ') }}</span>
                    </div>
                    <h4 class="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ anomaly.message || 'Optimization Opportunity' }}</h4>
                    <p class="text-sm text-slate-500 mt-1">{{ anomaly.context || 'We detected an anomaly that requires your attention.' }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-black text-slate-900" v-if="anomaly.value">
                    {{ typeof anomaly.value === 'number' ? formatCurrency(anomaly.value) : anomaly.value }}
                  </div>
                  <button class="mt-2 p-2 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowRight :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Widgets -->
        <div class="space-y-6">
          <h3 class="text-xl font-bold text-slate-800">Platform Health</h3>
          <div class="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-8">
            <!-- Google Ads -->
            <div class="flex items-center justify-between" v-if="selectedAccount?.googleAdsId">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Target size="20" /></div>
                <div>
                  <p class="text-sm font-bold text-slate-800">Google Ads</p>
                  <p class="text-[10px] text-slate-400 uppercase font-black">Score: {{ platformHealth.google }}%</p>
                </div>
              </div>
              <div class="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-500" 
                  :class="platformHealth.google > 80 ? 'bg-green-500' : platformHealth.google > 50 ? 'bg-orange-500' : 'bg-red-500'"
                  :style="{ width: `${platformHealth.google}%` }" 
                />
              </div>
            </div>

            <!-- Meta Ads -->
            <div class="flex items-center justify-between" v-if="selectedAccount?.facebookAdsId">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Facebook size="20" /></div>
                <div>
                  <p class="text-sm font-bold text-slate-800">Meta Ads</p>
                  <p class="text-[10px] text-slate-400 uppercase font-black">Score: {{ platformHealth.meta }}%</p>
                </div>
              </div>
              <div class="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-500" 
                  :class="platformHealth.meta > 80 ? 'bg-green-500' : platformHealth.meta > 50 ? 'bg-orange-500' : 'bg-red-500'"
                  :style="{ width: `${platformHealth.meta}%` }" 
                />
              </div>
            </div>

            <!-- GA4 -->
            <div class="flex items-center justify-between" v-if="selectedAccount?.ga4Id">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600"><Globe size="20" /></div>
                <div>
                  <p class="text-sm font-bold text-slate-800">GA4 Insights</p>
                  <p class="text-[10px] text-slate-400 uppercase font-black">Score: {{ platformHealth.ga4 }}%</p>
                </div>
              </div>
              <div class="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-500" 
                  :class="platformHealth.ga4 > 80 ? 'bg-green-500' : platformHealth.ga4 > 50 ? 'bg-orange-500' : 'bg-red-500'"
                  :style="{ width: `${platformHealth.ga4}%` }" 
                />
              </div>
            </div>

            <!-- Shopify -->
            <div class="flex items-center justify-between" v-if="selectedAccount?.shopifyId">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><ShoppingBag size="20" /></div>
                <div>
                  <p class="text-sm font-bold text-slate-800">Shopify Store</p>
                  <p class="text-[10px] text-slate-400 uppercase font-black">Score: {{ platformHealth.shopify }}%</p>
                </div>
              </div>
              <div class="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-500" 
                  :class="platformHealth.shopify > 80 ? 'bg-green-500' : platformHealth.shopify > 50 ? 'bg-orange-500' : 'bg-red-500'"
                  :style="{ width: `${platformHealth.shopify}%` }" 
                />
              </div>
            </div>

            <div class="flex items-center gap-3 opacity-40 grayscale" v-if="!selectedAccount?.shopifyId">
              <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Zap size="20" /></div>
              <div>
                <p class="text-sm font-bold text-slate-800">Email (Klaviyo)</p>
                <p class="text-[10px] text-slate-400 uppercase font-black">Not Connected</p>
              </div>
            </div>

            <button class="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
              <Zap :size="14" /> Add Channel
            </button>
          </div>

          <div class="bg-indigo-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
            <div class="relative z-10">
              <h4 class="font-bold text-indigo-200 text-xs uppercase tracking-widest mb-2">Pro Tip</h4>
              <p class="text-lg font-medium leading-snug">Accounts with an MER over 3.5x are in the top 10% of their category.</p>
              <button class="mt-6 flex items-center gap-2 text-sm font-bold text-indigo-300 hover:text-white transition-colors">
                Benchmark your store <ArrowRight size="16" />
              </button>
            </div>
            <Sparkles class="absolute -bottom-4 -right-4 w-32 h-32 text-indigo-800 opacity-20" />
          </div>
        </div>
            </div>
          </section>
      
          <!-- Floating Chat Toggle -->
          <button 
            @click="showChat = !showChat"
            class="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 transition-all z-50 group"
          >
            <MessageSquare v-if="!showChat" :size="28" />
            <X v-else :size="28" />
            <div class="absolute right-full mr-4 bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Ask Max anything about your data
            </div>
          </button>
      
          <!-- Chat Drawer -->
          <div 
            v-if="showChat"
            class="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[60] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300"
          >
            <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Sparkles :size="20" />
                </div>
                <div>
                  <h3 class="font-bold text-slate-900">Max Analysis Agent</h3>
                  <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest">Active • Cross-Platform Brain</p>
                </div>
              </div>
              <button @click="showChat = false" class="text-slate-400 hover:text-slate-600">
                <X :size="20" />
              </button>
            </div>
      
            <div class="flex-1 overflow-hidden relative">
              <!-- Deep Chat Component -->
              <deep-chat
                :request="{
                  url: '/api/chat',
                  method: 'POST',
                  additionalBodyProps: { context: chatContext }
                }"
                :introMessage="{ text: 'Hi! I\'m Max. I can analyze your ad performance, detect waste, and answer specific questions about your Google, Meta, or Shopify data. What can I help you with today?' }"
                :messageStyles='{
                  "default": {
                    "user": { "bubble": { "backgroundColor": "#4f46e5" } },
                    "ai": { "bubble": { "backgroundColor": "#f8fafc", "color": "#1e293b", "border": "1px solid #e2e8f0" } }
                  }
                }'
                class="h-full w-full border-none"
                style="border: none; width: 100%; height: 100%; font-family: Inter, sans-serif;"
              ></deep-chat>
            </div>
          </div>
        </div>
      </template>
      