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
  RefreshCw
} from 'lucide-vue-next';
import { useDateRange } from '../composables/useDateRange';
import QuestionsPanel from '../components/QuestionsPanel.vue';

const router = useRouter();
const ApexChart = VueApexCharts;

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
const { dateParams } = useDateRange();

// Real Data State
const scorecard = ref<any>(null);
const anomalies = ref<any[]>([]);
const questions = ref<any[]>([]);
const spendMix = ref<any>(null);
const loading = ref(true);
const spendDataLoading = ref(false);
const questionsLoading = ref(false);

const formatCurrency = (val: number, decimals = 0) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  }).format(val);
};

const loadAll = async () => {
  if (!selectedAccount?.value) return;
  loading.value = true;
  
  const acc = selectedAccount.value;
  const params = new URLSearchParams();
  if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
  if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);
  if (acc.ga4Id) params.append('ga4Id', acc.ga4Id);
  if (acc.shopifyId) params.append('shopifyId', acc.shopifyId);
  if (acc.instagramId) params.append('instagramId', acc.instagramId);
  if (acc.facebookPageId) params.append('facebookPageId', acc.facebookPageId);
  if (acc.gscId) params.append('gscId', acc.gscId);
  
  if (dateParams.value.startDate) params.append('startDate', dateParams.value.startDate);
  if (dateParams.value.endDate) params.append('endDate', dateParams.value.endDate);

  try {
    const [scoreRes, anomalyRes] = await Promise.all([
      fetch(`/api/executive/summary?${params.toString()}`).then(r => r.json()),
      fetch(`/api/monitors/anomalies?${params.toString()}`).then(r => r.json())
    ]);

    scorecard.value = scoreRes;
    // Handle new response format { anomalies, questions }
    anomalies.value = anomalyRes.anomalies || [];
  } catch (e) {
    console.error('Failed to load dashboard data', e);
  } finally {
    loading.value = false;
  }

  // Load homepage questions separately
  loadQuestions();
};

const loadQuestions = async () => {
  if (!selectedAccount?.value) return;
  questionsLoading.value = true;

  const acc = selectedAccount.value;
  const params = new URLSearchParams();
  if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
  if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);
  if (acc.ga4Id) params.append('ga4Id', acc.ga4Id);
  if (acc.shopifyId) params.append('shopifyId', acc.shopifyId);
  if (acc.instagramId) params.append('instagramId', acc.instagramId);
  if (acc.facebookPageId) params.append('facebookPageId', acc.facebookPageId);
  if (acc.gscId) params.append('gscId', acc.gscId);

  try {
    const res = await fetch(`/api/questions/homepage?${params.toString()}`).then(r => r.json());
    questions.value = res.questions || [];
  } catch (e) {
    console.error('Failed to load questions', e);
  } finally {
    questionsLoading.value = false;
  }
};

const loadSpendMix = async () => {
  if (!selectedAccount?.value) return;
  spendDataLoading.value = true;
  
  const acc = selectedAccount.value;
  const params = new URLSearchParams();
  if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
  if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);
  if (acc.ga4Id) params.append('ga4Id', acc.ga4Id);
  if (acc.shopifyId) params.append('shopifyId', acc.shopifyId);
  if (acc.instagramId) params.append('instagramId', acc.instagramId);
  if (acc.facebookPageId) params.append('facebookPageId', acc.facebookPageId);
  if (acc.gscId) params.append('gscId', acc.gscId);
  
  if (dateParams.value.startDate) params.append('start', dateParams.value.startDate);
  if (dateParams.value.endDate) params.append('end', dateParams.value.endDate);
  params.append('grain', 'total');

  try {
    const res = await fetch(`/api/reports/adsSpendBreakdown/live?${params.toString()}`).then(r => r.json());
    spendMix.value = res;
  } catch (e) {
    console.error('Failed to load spend mix', e);
  } finally {
    spendDataLoading.value = false;
  }
};

onMounted(() => {
  loadAll();
  loadSpendMix();
});

watch([selectedAccount, dateParams], () => {
  loadAll();
  loadSpendMix();
});

const googleSegments = computed(() => {
  if (!spendMix.value || !spendMix.value.rows) return [];
  const total = spendMix.value.rows.reduce((acc: number, r: any) => acc + r.spend, 0);
  return spendMix.value.rows
    .filter((r: any) => r.platform === 'google')
    .map((r: any) => ({
      id: r.channel_group,
      label: r.channel_group.replace(/_/g, ' '),
      value: r.spend,
      percent: (r.spend / total) * 100,
      color: '#3b82f6',
      platform: 'Google',
      roas: r.roas
    }));
});

const metaSegments = computed(() => {
  if (!spendMix.value || !spendMix.value.rows) return [];
  const total = spendMix.value.rows.reduce((acc: number, r: any) => acc + r.spend, 0);
  return spendMix.value.rows
    .filter((r: any) => r.platform === 'facebook')
    .map((r: any) => ({
      id: r.channel_group,
      label: r.channel_group,
      value: r.spend,
      percent: (r.spend / total) * 100,
      color: '#818cf8',
      platform: 'Meta',
      roas: r.roas
    }));
});

const grandTotal = computed(() => {
  if (!spendMix.value || !spendMix.value.rows) return 0;
  return spendMix.value.rows.reduce((acc: number, r: any) => acc + r.spend, 0);
});

const platformHealth = computed(() => {
  const scores = { google: 100, meta: 100, ga4: 100, shopify: 100 };
  anomalies.value.forEach(a => {
    const mid = a.measure_id.toLowerCase();
    const deduction = a.severity === 'critical' ? 25 : 10;
    if (mid.includes('google') || mid.includes('pmax')) scores.google -= deduction;
    else if (mid.includes('facebook') || mid.includes('ads_')) scores.meta -= deduction;
    else if (mid.includes('ga4')) scores.ga4 -= deduction;
    else if (mid.includes('shopify')) scores.shopify -= deduction;
  });
  return {
    google: Math.max(0, scores.google),
    meta: Math.max(0, scores.meta),
    ga4: Math.max(0, scores.ga4),
    shopify: Math.max(0, scores.shopify)
  };
});

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

      <!-- Questions Panel -->
      <QuestionsPanel
        v-if="questions.length > 0 || questionsLoading"
        :questions="questions"
        :loading="questionsLoading"
        title="Questions to Explore"
        class="mb-8"
        @ask="(q) => console.log('Ask question:', q)"
      />

      <!-- Executive Scorecard -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" v-if="scorecard">
        <!-- Holistic MER -->
        <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm group/tooltip relative">
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
          <!-- Tooltip -->
          <div class="absolute top-full left-4 right-4 mt-2 bg-slate-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            This is your 'Marketing Efficiency Ratio.' It shows your total store revenue relative to your total ad spend. A higher number means your marketing is working more efficiently to drive overall business growth.
          </div>
        </div>

        <!-- Total Ad Spend -->
        <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm group/tooltip relative">
          <div class="flex justify-between items-start mb-4">
            <span class="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Ad Spend</span>
            <Wallet class="w-5 h-5 text-red-400" />
          </div>
          <div class="text-4xl font-black text-slate-900 mb-2">{{ formatCurrency(scorecard.scorecard.spend.value) }}</div>
          <div class="flex items-center gap-1 text-xs" :class="scorecard.scorecard.spend.change <= 0 ? 'text-green-600' : 'text-slate-500'">
            <span class="font-bold">{{ scorecard.scorecard.spend.change.toFixed(1) }}%</span>
            <span class="text-slate-400 font-normal ml-1">spend velocity</span>
          </div>
          <!-- Tooltip -->
          <div class="absolute top-full left-4 right-4 mt-2 bg-slate-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            The total amount you've invested in advertising across all platforms (like Meta and Google) during this timeframe.
          </div>
        </div>

        <!-- Store Revenue -->
        <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm group/tooltip relative">
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
          <!-- Tooltip -->
          <div class="absolute top-full left-4 right-4 mt-2 bg-slate-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            Your total gross sales recorded in Shopify. This includes all orders, whether they came from an ad, an email, or someone coming to your site directly.
          </div>
        </div>

        <!-- Acquisition Health -->
        <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm group/tooltip relative">
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
          <!-- Tooltip -->
          <div class="absolute top-full left-4 right-4 mt-2 bg-slate-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            This tracks your success in finding new customers. A high percentage means you are effectively growing your audience; a lower percentage means you are primarily relying on repeat buyers.
          </div>
        </div>
      </div>

      <!-- Attribution & Efficiency -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" v-if="scorecard && scorecard.scorecard.tcac">
        <!-- True CAC -->
        <div class="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm group/tooltip relative">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="text-xl font-bold text-slate-800">True CAC</h3>
              <p class="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">Attribution Reality Check</p>
            </div>
            <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Target :size="24" />
            </div>
          </div>
          <!-- Tooltip -->
          <div class="absolute top-full left-4 right-4 mt-2 bg-slate-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            The 'Attribution Reality Check.' This is exactly what you paid in ads to get one new customer into your store, using your actual customer data rather than platform guesses.
          </div>

          <div class="flex items-end gap-4 mb-8">
            <div class="text-5xl font-black text-slate-900 leading-none">
              {{ formatCurrency(scorecard.scorecard.tcac.value, 2) }}
            </div>
            <div class="pb-1">
              <div class="flex items-center gap-1 text-xs font-bold" :class="scorecard.scorecard.tcac.change <= 0 ? 'text-green-600' : 'text-red-600'">
                <component :is="scorecard.scorecard.tcac.change <= 0 ? ArrowDownRight : ArrowUpRight" size="14" />
                {{ Math.abs(scorecard.scorecard.tcac.change).toFixed(1) }}%
              </div>
              <div class="text-[10px] text-slate-400 uppercase font-black">vs prev</div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <div class="text-sm font-bold text-slate-600">Platform-Reported CAC</div>
              <div class="text-sm font-black text-slate-400 line-through decoration-red-400/50">
                {{ formatCurrency(scorecard.scorecard.tcac.platformCac, 2) }}
              </div>
            </div>
            <p class="text-[10px] text-center text-slate-400 px-4 italic">
              Platforms over-claim credit by
              <span class="font-bold text-red-400">
                {{ scorecard.scorecard.tcac.platformCac > 0 ? (((scorecard.scorecard.tcac.value / scorecard.scorecard.tcac.platformCac) - 1) * 100).toFixed(0) : '0' }}%
              </span>
              on average compared to your Shopify new customer file.
            </p>
          </div>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm group/tooltip relative">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="text-xl font-bold text-slate-800">Efficiency Gap</h3>
              <p class="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">Blended vs Platform ROAS</p>
            </div>
            <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Zap :size="24" />
            </div>
          </div>
          <!-- Tooltip -->
          <div class="absolute top-full left-4 right-4 mt-2 bg-slate-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            This highlights the difference between what platforms like Meta claim they are doing versus the actual profit you see in your bank account. It helps identify if platforms are 'over-claiming' credit for the same sale.
          </div>

          <div class="grid grid-cols-2 gap-8 mb-8">
            <div>
              <div class="text-[10px] text-slate-400 uppercase font-black mb-1">Blended ROAS (MER)</div>
              <div class="text-3xl font-black text-slate-900">{{ scorecard.scorecard.mer.value.toFixed(2) }}x</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase font-black mb-1">Platform Reported</div>
              <div class="text-3xl font-black text-slate-400 line-through decoration-red-400/50">
                {{ scorecard.scorecard.tcac.platformRoas.toFixed(2) }}x
              </div>
            </div>
          </div>

          <div class="relative pt-4">
            <!-- Efficiency Gap value (MER - Platform ROAS) -->
            <div class="text-center mb-4">
              <div class="text-4xl font-black" :class="(scorecard.scorecard.tcac.efficiencyGap ?? (scorecard.scorecard.mer.value - scorecard.scorecard.tcac.platformRoas)) >= 0 ? 'text-green-600' : 'text-red-500'">
                {{ (scorecard.scorecard.tcac.efficiencyGap ?? (scorecard.scorecard.mer.value - scorecard.scorecard.tcac.platformRoas)) >= 0 ? '+' : '' }}{{ (scorecard.scorecard.tcac.efficiencyGap ?? (scorecard.scorecard.mer.value - scorecard.scorecard.tcac.platformRoas)).toFixed(2) }}x
              </div>
              <div class="text-[10px] text-slate-400 uppercase font-black mt-1">
                {{ (scorecard.scorecard.tcac.efficiencyGap ?? (scorecard.scorecard.mer.value - scorecard.scorecard.tcac.platformRoas)) < 0 ? 'Platforms over-claiming by' : 'Platforms under-reporting by' }}
                {{ Math.abs(scorecard.scorecard.tcac.efficiencyGap ?? (scorecard.scorecard.mer.value - scorecard.scorecard.tcac.platformRoas)).toFixed(2) }}x
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Spend Breakdown -->
      <div class="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm mb-8 group/tooltip relative">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 :size="24" class="text-indigo-500" />
              Marketing Mix
            </h3>
            <p class="text-sm text-slate-400">Holistic allocation across search and social channels.</p>
          </div>
          <!-- Tooltip -->
          <div class="absolute top-20 left-4 right-4 bg-slate-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            A bird's-eye view of where your money is going. This helps you ensure you aren't over-investing in one area (like Social) while neglecting another (like Search).
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
              </div>
              <div class="space-y-4">
                <div v-for="s in googleSegments" :key="s.id" class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: s.color }" />
                    <span class="text-sm font-medium text-slate-600">{{ s.label }}</span>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="text-sm font-bold text-slate-800">{{ formatCurrency(s.value) }}</span>
                    <span class="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">{{ s.percent.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><LayoutGrid size="14" class="text-indigo-500" /> Meta Ads</span>
              </div>
              <div class="space-y-4">
                <div v-for="s in metaSegments" :key="s.id" class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: s.color }" />
                    <span class="text-sm font-medium text-slate-600">{{ s.label }}</span>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="text-sm font-bold text-slate-800">{{ formatCurrency(s.value) }}</span>
                    <span class="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">{{ s.percent.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Opportunity Feed & Health -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Zap :size="24" class="text-amber-500" />
              Optimization Opportunities
            </h3>
            <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">{{ anomalies.length }} Detected</span>
          </div>
          
          <div v-if="loading" class="space-y-4">
            <div v-for="i in 3" :key="i" class="h-32 bg-white rounded-3xl animate-pulse border border-slate-100" />
          </div>
          
          <div v-else class="space-y-4">
            <div v-for="a in anomalies" :key="a.id" class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-all group flex items-start gap-6">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" :class="a.severity === 'critical' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'">
                <AlertCircle :size="24" />
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] font-black uppercase tracking-tighter" :class="a.severity === 'critical' ? 'text-red-400' : 'text-amber-400'">{{ a.severity }} Priority</span>
                  <span class="text-[10px] text-slate-400 flex items-center gap-1"><Clock size="10" /> {{ new Date(a.detected_at).toLocaleDateString() }}</span>
                </div>
                <h4 class="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ a.message }}</h4>
                <p class="text-xs text-slate-500 mt-2 line-clamp-2">{{ a.payload?.details || 'Performance deviation detected in ' + a.measure_id }}</p>
              </div>
              <div class="self-center">
                <button class="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ArrowRight :size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm sticky top-8">
            <h3 class="text-lg font-bold text-slate-800 mb-6">Platform Health</h3>
            <div class="space-y-8">
              <!-- Google -->
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

              <!-- Meta -->
              <div class="flex items-center justify-between" v-if="selectedAccount?.facebookAdsId">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><LayoutGrid size="20" /></div>
                  <div>
                    <p class="text-sm font-bold text-slate-800">Meta Universe</p>
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
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>