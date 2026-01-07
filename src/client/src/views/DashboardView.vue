<script setup lang="ts">
import { computed, ref, onMounted, watch, inject, type Ref } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import { useRouter } from 'vue-router';
import { TrendingUp, ArrowUpRight, ArrowRight, LayoutGrid, Sparkles, Target, Zap, PieChart, Wallet, ChevronDown, CheckCircle, BarChart3 } from 'lucide-vue-next';
import type { ChartDataPoint } from '../types';

const router = useRouter();
const ApexChart = VueApexCharts;

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
  ga4Id: string | null;
}

interface SpendSegment {
  id: string;
  label: string;
  value: number;
  percent: number;
  relativePercent: number; // Percent relative to platform total
  color: string;
  platform: 'Google' | 'Meta';
  roas: number;
}

// Global Account State injected from layout
const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');

const dataLifetime: ChartDataPoint[] = [
  { name: 'Jan', actions: 4, value: 300 },
  { name: 'Feb', actions: 6, value: 850 },
  { name: 'Mar', actions: 8, value: 1600 },
  { name: 'Apr', actions: 5, value: 2100 },
  { name: 'May', actions: 12, value: 3500 },
  { name: 'Jun', actions: 9, value: 4600 },
  { name: 'Jul', actions: 11, value: 6200 },
  { name: 'Aug', actions: 7, value: 7100 },
  { name: 'Sep', actions: 14, value: 9500 }
];

const dataYTD: ChartDataPoint[] = dataLifetime.slice(0, 5);
const data90d: ChartDataPoint[] = [
  { name: 'Wk 1', actions: 2, value: 120 },
  { name: 'Wk 2', actions: 4, value: 450 },
  { name: 'Wk 3', actions: 3, value: 680 },
  { name: 'Wk 4', actions: 6, value: 1200 },
  { name: 'Wk 5', actions: 5, value: 1650 },
  { name: 'Wk 6', actions: 8, value: 2400 }
];

const timeRange = ref<'lifetime' | 'ytd' | '90d'>('lifetime');

const currentChartData = computed(() => {
  if (timeRange.value === 'ytd') return dataYTD;
  if (timeRange.value === '90d') return data90d;
  return dataLifetime;
});

const focusChartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    stacked: false,
    fontFamily: 'Inter, sans-serif'
  },
  stroke: { width: [0, 3], curve: 'smooth' },
  dataLabels: { enabled: false },
  grid: { borderColor: '#e7e5e4', strokeDashArray: 3 },
  colors: ['#c3fd34', '#7c3aed'],
  xaxis: {
    categories: currentChartData.value.map((d) => d.name),
    labels: { style: { colors: '#94a3b8', fontSize: '12px' } }
  },
  yaxis: [
    { labels: { style: { colors: '#94a3b8' } }, title: { text: 'Optimizations', style: { color: '#94a3b8' } } },
    { opposite: true, labels: { style: { colors: '#94a3b8' } }, title: { text: 'Value ($)', style: { color: '#94a3b8' } } }
  ],
  legend: { show: false },
  tooltip: { shared: true, intersect: false }
}));

const focusSeries = computed(() => [
  { name: 'Optimizations', type: 'column', data: currentChartData.value.map((d) => d.actions) },
  { name: 'Value ($)', type: 'line', data: currentChartData.value.map((d) => d.value) }
]);

const formatCurrency = (value: number) =>
  `$${(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatRoas = (value: number) =>
  value > 0 ? `${value.toFixed(1)}x` : '—';

// Spend Distribution Data
const spendDataLoading = ref(false);
const spendDataError = ref<string | null>(null);
const googleSegments = ref<SpendSegment[]>([]);
const metaSegments = ref<SpendSegment[]>([]);
const grandTotal = ref(0);
const googleTotal = ref(0);
const metaTotal = ref(0);
const hoveredSegmentId = ref<string | null>(null);

const loadSpendData = async () => {
  if (!selectedAccount?.value) {
    resetData();
    return;
  }

  const { id, googleAdsId, facebookAdsId, ga4Id } = selectedAccount.value;
  if (!id && !googleAdsId && !facebookAdsId && !ga4Id) {
    resetData();
    return;
  }

  spendDataLoading.value = true;
  spendDataError.value = null;

  try {
    const params = new URLSearchParams();
    if (id) params.append('accountId', id);
    if (googleAdsId) params.append('googleAdsId', googleAdsId);
    if (facebookAdsId) params.append('facebookAdsId', facebookAdsId);
    if (ga4Id) params.append('ga4Id', ga4Id);

    const response = await fetch(`/api/aggregateReports/ads-spend-breakdown?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch spend data');
    
    const allData = await response.json();
    const rows: any[] = Array.isArray(allData) ? allData : [];

    let totalG = 0;
    let totalM = 0;
    const gSegs: SpendSegment[] = [];
    const mSegs: SpendSegment[] = [];

    const googleCatColors: string[] = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#1a73e8'];
    const metaCatColors: string[] = ['#0668E1', '#833AB4', '#E1306C', '#C13584', '#FD1D1D'];

    // Group rows by platform
    rows.forEach((item, idx) => {
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

    // Sort
    gSegs.sort((a, b) => b.value - a.value);
    mSegs.sort((a, b) => b.value - a.value);

    const total = totalG + totalM;

    // Calculate percentages
    if (total > 0) {
      gSegs.forEach(s => {
        s.percent = (s.value / total) * 100;
        s.relativePercent = (s.value / totalG) * 100;
      });
      mSegs.forEach(s => {
        s.percent = (s.value / total) * 100;
        s.relativePercent = (s.value / totalM) * 100;
      });
    }

    grandTotal.value = total;
    googleTotal.value = totalG;
    metaTotal.value = totalM;
    googleSegments.value = gSegs;
    metaSegments.value = mSegs;

  } catch (error) {
    console.error('Failed to load spend data', error);
    spendDataError.value = 'Failed to load spend data.';
    resetData();
  } finally {
    spendDataLoading.value = false;
  }
};

const resetData = () => {
  grandTotal.value = 0;
  googleTotal.value = 0;
  metaTotal.value = 0;
  googleSegments.value = [];
  metaSegments.value = [];
};

const googleWidth = computed(() => {
  if (grandTotal.value === 0) return 0;
  return (googleTotal.value / grandTotal.value) * 100;
});

const metaWidth = computed(() => {
  if (grandTotal.value === 0) return 0;
  return (metaTotal.value / grandTotal.value) * 100;
});

const googleAvgRoas = computed(() => {
  if (googleTotal.value === 0) return 0;
  const weightedSum = googleSegments.value.reduce((acc, s) => acc + (s.value * s.roas), 0);
  return weightedSum / googleTotal.value;
});

const metaAvgRoas = computed(() => {
  if (metaTotal.value === 0) return 0;
  const weightedSum = metaSegments.value.reduce((acc, s) => acc + (s.value * s.roas), 0);
  return weightedSum / metaTotal.value;
});

onMounted(() => {
  if (selectedAccount?.value) {
    loadSpendData();
  }
});

watch(() => selectedAccount?.value, () => {
  loadSpendData();
}, { immediate: true });
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
    <section
      class="p-8 font-sans animate-in fade-in duration-500 overflow-y-auto h-full pb-20"
    >
      <!-- Welcome Header -->
      <div class="mb-8 flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold text-slate-800">
            {{ selectedAccount ? `Ready to win, ${selectedAccount.name}?` : 'Welcome to Maxed Marketing' }}
          </h1>
          <p class="text-slate-500 mt-1 max-w-2xl">
            You've unlocked
            <span class="font-bold text-amplify-purple">$9,500</span> in
            lifetime value. We found
            <span class="font-bold text-slate-800">1 high-impact action</span>
            for you today.
          </p>
        </div>
        <div class="text-[10px] text-amplify-purple font-mono">
          Design ID: L3-MOMENTUM
        </div>
      </div>

      <!-- Momentum Chart -->
      <div
        class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm mb-8"
      >
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
        >
          <div>
            <h3
              class="text-lg font-bold text-slate-800 flex items-center gap-2"
            >
              <TrendingUp
                :size="20"
                class="text-amplify-green fill-amplify-green/20"
              />
              Maxed Momentum
            </h3>
            <p class="text-xs text-slate-400 text-slate-800">
              <span v-if="timeRange === 'lifetime'"
                >Your cumulative value unlocked since joining Maxed.</span
              >
              <span v-else-if="timeRange === 'ytd'"
                >Value unlocked since January 1st.</span
              >
              <span v-else>Recent optimization impact (Last 90 Days).</span>
            </p>
          </div>
          <div class="flex bg-stone-100 p-1 rounded-xl">
            <button
              @click="timeRange = 'lifetime'"
              class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              :class="timeRange === 'lifetime' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            >
              Lifetime
            </button>
            <button
              @click="timeRange = 'ytd'"
              class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              :class="timeRange === 'ytd' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            >
              Year to Date
            </button>
            <button
              @click="timeRange = '90d'"
              class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              :class="timeRange === '90d' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            >
              Last 90 Days
            </button>
          </div>
        </div>
        <div class="h-48 w-full">
          <ApexChart
            type="line"
            height="200"
            :options="focusChartOptions"
            :series="focusSeries"
          />
        </div>
      </div>

      <!-- Spend Breakdown (Full Width Card) -->
      <div
        class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm mb-8"
      >
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3
              class="text-lg font-bold text-slate-800 flex items-center gap-2"
            >
              <BarChart3 :size="20" class="text-blue-500 fill-blue-500/20" />
              Marketing Spend Breakdown
            </h3>
            <p class="text-xs text-slate-400">
              Total spend across connected platforms (90d).
            </p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-slate-800">
              {{ formatCurrency(grandTotal) }}
            </div>
            <div
              class="text-[10px] text-slate-400 font-bold uppercase tracking-wider"
            >
              Total Spend
            </div>
          </div>
        </div>

        <div v-if="spendDataLoading" class="py-8 flex justify-center">
          <div
            class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"
          ></div>
        </div>

        <div
          v-else-if="spendDataError"
          class="py-8 text-center text-red-500 text-sm"
        >
          {{ spendDataError }}
        </div>

        <div
          v-else-if="grandTotal === 0"
          class="py-8 text-center text-slate-400 text-sm italic"
        >
          No spend data available. Check your account settings.
        </div>

        <template v-else>
          <!-- Split Stacked Bar Container -->
          <div
            class="w-full flex mb-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-100"
          >
            <!-- Google Group -->
            <div
              v-if="googleTotal > 0"
              class="flex flex-col gap-y-[2px]"
              :style="{ width: `${googleWidth}%` }"
            >
              <!-- Row 1: Categories -->
              <div class="h-8 w-full flex">
                <div
                  v-for="segment in googleSegments"
                  :key="segment.id"
                  class="h-full transition-all duration-300 relative group cursor-pointer border-r border-white/20 last:border-0"
                  :class="{ 'opacity-100 z-10': hoveredSegmentId === segment.id, 'opacity-70': hoveredSegmentId && hoveredSegmentId !== segment.id }"
                  :style="{ width: `${segment.relativePercent}%`, backgroundColor: segment.color }"
                  @mouseenter="hoveredSegmentId = segment.id"
                  @mouseleave="hoveredSegmentId = null"
                >
                  <div
                    class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none"
                  >
                    {{ segment.label }}: {{ formatCurrency(segment.value) }}
                    <div
                      class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"
                    ></div>
                  </div>
                </div>
              </div>
              <!-- Row 2: Platform Line -->
              <div class="h-1.5 w-full bg-[#EA4335]"></div>
            </div>

            <!-- Meta Group -->
            <div
              v-if="metaTotal > 0"
              class="flex flex-col border-l border-white gap-y-[2px]"
              :style="{ width: `${metaWidth}%` }"
            >
              <!-- Row 1: Categories -->
              <div class="h-8 w-full flex">
                <div
                  v-for="segment in metaSegments"
                  :key="segment.id"
                  class="h-full transition-all duration-300 relative group cursor-pointer border-r border-white/20 last:border-0"
                  :class="{ 'opacity-100 z-10': hoveredSegmentId === segment.id, 'opacity-70': hoveredSegmentId && hoveredSegmentId !== segment.id }"
                  :style="{ width: `${segment.relativePercent}%`, backgroundColor: segment.color }"
                  @mouseenter="hoveredSegmentId = segment.id"
                  @mouseleave="hoveredSegmentId = null"
                >
                  <div
                    class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none"
                  >
                    {{ segment.label }}: {{ formatCurrency(segment.value) }}
                    <div
                      class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"
                    ></div>
                  </div>
                </div>
              </div>
              <!-- Row 2: Platform Line -->
              <div class="h-1.5 w-full bg-[#0668E1]"></div>
            </div>
          </div>

          <!-- Breakdown Cards Grouped -->
          <div class="space-y-10">
            <!-- Google Ads Section -->
            <div v-if="googleTotal > 0">
              <div
                class="flex items-center justify-between mb-4 border-b border-stone-100 pb-2"
              >
                <h4 class="text-sm font-bold text-slate-700 flex items-center">
                  <Target class="w-4 h-4 mr-2 text-[#EA4335]" />
                  Google Ads Breakdown
                </h4>
                <div
                  class="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                >
                  <div>
                    Share
                    <span class="text-slate-700 ml-1"
                      >{{ googleWidth.toFixed(1) }}%</span
                    >
                  </div>
                  <div>
                    Total
                    <span
                      class="text-slate-700 ml-1"
                      >{{ formatCurrency(googleTotal) }}</span
                    >
                  </div>
                  <div>
                    Avg ROAS
                    <span
                      class="text-green-600 ml-1"
                      >{{ formatRoas(googleAvgRoas) }}</span
                    >
                  </div>
                </div>
              </div>
              <div
                class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              >
                <div
                  v-for="segment in googleSegments"
                  :key="segment.id"
                  class="bg-stone-50 rounded-xl p-3 border transition-all duration-300 cursor-default"
                  :class="[
                    hoveredSegmentId === segment.id ? 'border-indigo-400 bg-indigo-50/50 shadow-md transform -translate-y-1' : 'border-stone-100',
                    { 'opacity-50 grayscale-[0.5]': hoveredSegmentId && hoveredSegmentId !== segment.id }
                  ]"
                  @mouseenter="hoveredSegmentId = segment.id"
                  @mouseleave="hoveredSegmentId = null"
                >
                  <div class="flex items-center gap-2 mb-2 overflow-hidden">
                    <div
                      class="w-2.5 h-2.5 rounded-full shrink-0"
                      :style="{ backgroundColor: segment.color }"
                    ></div>
                    <span
                      class="text-xs font-bold text-slate-700 truncate"
                      :title="segment.label"
                      >{{ segment.label }}</span
                    >
                  </div>
                  <div class="flex items-baseline justify-between mb-1">
                    <span
                      class="text-sm font-bold text-slate-800"
                      >{{ formatCurrency(segment.value) }}</span
                    >
                    <span class="text-[10px] font-bold text-slate-400"
                      >{{ segment.percent.toFixed(1) }}%</span
                    >
                  </div>
                  <div class="text-[10px] text-slate-400">
                    ROAS:
                    <span
                      class="font-bold text-slate-600"
                      >{{ formatRoas(segment.roas) }}</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Meta Ads Section -->
            <div v-if="metaTotal > 0">
              <div
                class="flex items-center justify-between mb-4 border-b border-stone-100 pb-2"
              >
                <h4 class="text-sm font-bold text-slate-700 flex items-center">
                  <div
                    class="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold mr-2 uppercase"
                  >
                    f
                  </div>
                  Meta Ads Breakdown
                </h4>
                <div
                  class="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                >
                  <div>
                    Share
                    <span class="text-slate-700 ml-1"
                      >{{ metaWidth.toFixed(1) }}%</span
                    >
                  </div>
                  <div>
                    Total
                    <span
                      class="text-slate-700 ml-1"
                      >{{ formatCurrency(metaTotal) }}</span
                    >
                  </div>
                  <div>
                    Avg ROAS
                    <span
                      class="text-green-600 ml-1"
                      >{{ formatRoas(metaAvgRoas) }}</span
                    >
                  </div>
                </div>
              </div>
              <div
                class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              >
                <div
                  v-for="segment in metaSegments"
                  :key="segment.id"
                  class="bg-stone-50 rounded-xl p-3 border transition-all duration-300 cursor-default"
                  :class="[
                    hoveredSegmentId === segment.id ? 'border-indigo-400 bg-indigo-50/50 shadow-md transform -translate-y-1' : 'border-stone-100',
                    { 'opacity-50 grayscale-[0.5]': hoveredSegmentId && hoveredSegmentId !== segment.id }
                  ]"
                  @mouseenter="hoveredSegmentId = segment.id"
                  @mouseleave="hoveredSegmentId = null"
                >
                  <div class="flex items-center gap-2 mb-2 overflow-hidden">
                    <div
                      class="w-2.5 h-2.5 rounded-full shrink-0"
                      :style="{ backgroundColor: segment.color }"
                    ></div>
                    <span
                      class="text-xs font-bold text-slate-700 truncate"
                      :title="segment.label"
                      >{{ segment.label }}</span
                    >
                  </div>
                  <div class="flex items-baseline justify-between mb-1">
                    <span
                      class="text-sm font-bold text-slate-800"
                      >{{ formatCurrency(segment.value) }}</span
                    >
                    <span class="text-[10px] font-bold text-slate-400"
                      >{{ segment.percent.toFixed(1) }}%</span
                    >
                  </div>
                  <div class="text-[10px] text-slate-400">
                    ROAS:
                    <span
                      class="font-bold text-slate-600"
                      >{{ formatRoas(segment.roas) }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Priority Focus & Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <h3 class="text-lg font-bold text-slate-800">Priority Focus</h3>
          <div
            class="bg-white rounded-2xl p-1 shadow-sm border border-stone-100 hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div
              class="absolute top-0 left-0 w-1.5 h-full bg-amplify-purple"
            ></div>
            <div class="p-6 pl-8">
              <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-2">
                  <span
                    class="bg-amplify-purple/10 text-amplify-purple px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                    >Top Priority</span
                  >
                  <span class="text-slate-400 text-xs flex items-center gap-1"
                    ><Target :size="12" /> Google Ads Suite</span
                  >
                </div>
                <div class="text-right">
                  <div class="text-xs text-slate-400 font-medium">
                    Potential Impact
                  </div>
                  <div class="text-lg font-bold text-green-600">
                    +$420.00<span class="text-xs text-slate-400 font-normal"
                      >/mo</span
                    >
                  </div>
                </div>
              </div>
              <h4 class="text-xl font-bold text-slate-800 mb-2 text-slate-800">
                Negative Keyword Opportunity
              </h4>
              <p
                class="text-slate-500 mb-6 max-w-lg leading-relaxed text-slate-800"
              >
                We've detected high spend on the term "free guitars" which has a
                95% bounce rate. Blocking this will improve your ROAS
                immediately.
              </p>
              <div class="flex items-center gap-3 flex-wrap">
                <button
                  class="bg-amplify-purple text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amplify-purple/20 hover:bg-amplify-purple/90 transition-all flex items-center gap-2"
                >
                  Fix This Now <ArrowUpRight :size="16" />
                </button>
                <button
                  class="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-stone-50 transition-colors"
                >
                  View Details
                </button>
                <div class="flex-1 text-right">
                  <button
                    @click="router.push('/google-ads')"
                    class="text-xs font-semibold text-slate-400 hover:text-amplify-purple transition-colors inline-flex items-center gap-1"
                  >
                    See all 3 Google Ads opportunities <ArrowRight :size="12" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <h3
            class="text-sm font-bold text-slate-400 uppercase tracking-wider mt-8"
          >
            Up Next
          </h3>
          <div class="space-y-3">
            <div
              class="bg-white rounded-2xl p-4 border border-stone-100 flex items-center justify-between hover:border-amplify-green transition-colors cursor-pointer group text-slate-800"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"
                >
                  <LayoutGrid :size="20" />
                </div>
                <div>
                  <h5
                    class="font-bold text-slate-700 group-hover:text-amplify-purple transition-colors"
                  >
                    Facebook Ads: Low Efficiency
                  </h5>
                  <p class="text-xs text-slate-400">
                    Ad Set "Winter Promo" is underperforming.
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="text-right hidden sm:block">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">
                    Potential Impact
                  </div>
                  <div class="text-sm font-bold text-green-600">
                    +$185.00/mo
                  </div>
                </div>
                <button
                  class="p-2 text-slate-300 hover:text-amplify-green transition-colors"
                >
                  <ArrowUpRight :size="20" />
                </button>
              </div>
            </div>

            <div
              class="bg-white rounded-2xl p-4 border border-stone-100 flex items-center justify-between hover:border-amplify-green transition-colors cursor-pointer group text-slate-800"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-full bg-purple-50 text-amplify-purple flex items-center justify-center"
                >
                  <Sparkles :size="20" />
                </div>
                <div>
                  <h5
                    class="font-bold text-slate-700 group-hover:text-amplify-purple transition-colors"
                  >
                    Social Spark: Event Post
                  </h5>
                  <p class="text-xs text-slate-400">
                    Create a post for your upcoming weekend sale.
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="text-right hidden sm:block">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">
                    Value
                  </div>
                  <div class="text-sm font-bold text-slate-600">Engagement</div>
                </div>
                <button
                  class="p-2 text-slate-300 hover:text-amplify-green transition-colors"
                >
                  <ArrowUpRight :size="20" />
                </button>
              </div>
            </div>

            <div
              class="bg-white rounded-2xl p-4 border border-stone-100 flex items-center justify-between hover:border-amplify-green transition-colors cursor-pointer group text-slate-800"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"
                >
                  <Target :size="20" />
                </div>
                <div>
                  <h5
                    class="font-bold text-slate-700 group-hover:text-amplify-purple transition-colors"
                  >
                    Local SEO: 5-Star Review
                  </h5>
                  <p class="text-xs text-slate-400">
                    New review from "John D." requires response.
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="text-right hidden sm:block">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">
                    Value
                  </div>
                  <div class="text-sm font-bold text-slate-600">Reputation</div>
                </div>
                <button
                  class="p-2 text-slate-300 hover:text-amplify-green transition-colors"
                >
                  <ArrowUpRight :size="20" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <h3 class="text-lg font-bold text-slate-800">Active Apps</h3>
          <div
            class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm space-y-6"
          >
            <div
              class="flex items-start gap-4 pb-6 border-b border-stone-50 text-slate-800"
            >
              <div class="mt-1">
                <div
                  class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                />
              </div>
              <div>
                <h4 class="font-bold text-slate-700 text-sm">
                  Google Ads Suite
                </h4>
                <p class="text-xs text-slate-400 mt-1">
                  Optimization Score:
                  <span class="text-green-600 font-bold">84%</span>
                </p>
                <p class="text-[10px] text-slate-400 mt-0.5">
                  Last check: 20m ago
                </p>
              </div>
            </div>
            <div
              class="flex items-start gap-4 pb-6 border-b border-stone-50 text-slate-800"
            >
              <div class="mt-1">
                <div class="w-2 h-2 rounded-full bg-slate-300" />
              </div>
              <div>
                <h4 class="font-bold text-slate-700 text-sm">Social Spark</h4>
                <p class="text-xs text-slate-400 mt-1">Ready for input</p>
              </div>
            </div>
            <div class="flex items-start gap-4 text-slate-800">
              <div class="mt-1">
                <div class="w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <div>
                <h4 class="font-bold text-slate-700 text-sm">Local SEO</h4>
                <p class="text-xs text-slate-400 mt-1">
                  1 Review needs response
                </p>
              </div>
            </div>
            <button
              class="w-full py-3 mt-4 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-400 hover:text-amplify-purple hover:border-amplify-purple transition-colors flex items-center justify-center gap-2"
            >
              <Zap :size="14" /> Add New Mini-App
            </button>
          </div>

          <div
            class="bg-amplify-purple/5 p-6 rounded-[2rem] border border-amplify-purple/10"
          >
            <h4 class="font-bold text-amplify-purple text-sm mb-2">
              Did you know?
            </h4>
            <p class="text-xs text-slate-600 leading-relaxed">
              Optimizing your negative keywords once a week can save up to 20%
              of your ad budget. You're doing great!
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
