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

// Real Data State
const scorecard = ref<any>(null);
const anomalies = ref<any[]>([]);
const spendMix = ref<any>(null);
const loading = ref(true);
const spendDataLoading = ref(false);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
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
  params.append('days', '30');

  try {
    const [scoreRes, anomalyRes] = await Promise.all([
      fetch(`/api/executive/summary?${params.toString()}`).then(r => r.json()),
      fetch(`/api/monitors/anomalies?${params.toString()}`).then(r => r.json())
    ]);
    
    scorecard.value = scoreRes;
    anomalies.value = anomalyRes;
  } catch (e) {
    console.error('Failed to load dashboard data', e);
  } finally {
    loading.value = false;
  }
};

const loadSpendMix = async () => {
  if (!selectedAccount?.value) return;
  spendDataLoading.value = true;
  
  const acc = selectedAccount.value;
  const params = new URLSearchParams();
  if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
  if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);
  params.append('days', timeRange.value === 'ytd' ? '30' : '90');

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

watch(selectedAccount, () => {
  loadAll();
  loadSpendMix();
});

watch(timeRange, () => {
  loadSpendMix();
});

const googleSegments = computed(() => {
  if (!spendMix.value) return [];
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
  if (!spendMix.value) return [];
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
  if (!spendMix.value) return 0;
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
