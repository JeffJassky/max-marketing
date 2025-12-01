<script setup lang="ts">
import { computed, ref } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import { useRouter } from 'vue-router';
import { TrendingUp, ArrowUpRight, ArrowRight, LayoutGrid, Sparkles, Target, Zap } from 'lucide-vue-next';
import type { ChartDataPoint } from '../types';
const router = useRouter();
const ApexChart = VueApexCharts;

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
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
    <section class="p-8 font-sans animate-in fade-in duration-500 overflow-y-auto h-full pb-20">
      <div class="mb-8 flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold text-slate-800">Ready to win the week, Alex?</h1>
          <p class="text-slate-500 mt-1 max-w-2xl">
            You've unlocked <span class="font-bold text-amplify-purple">$9,500</span> in lifetime value.
            We found <span class="font-bold text-slate-800">1 high-impact action</span> for you today.
          </p>
        </div>
        <div class="text-[10px] text-amplify-purple font-mono">Design ID: L3-MOMENTUM</div>
      </div>

      <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm mb-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp :size="20" class="text-amplify-green fill-amplify-green/20" />
              Maxed Momentum
            </h3>
            <p class="text-xs text-slate-400">
              <span v-if="timeRange === 'lifetime'">Your cumulative value unlocked since joining Maxed.</span>
              <span v-else-if="timeRange === 'ytd'">Value unlocked since January 1st.</span>
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
          <ApexChart type="line" height="200" :options="focusChartOptions" :series="focusSeries" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <h3 class="text-lg font-bold text-slate-800">Priority Focus</h3>
          <div class="bg-white rounded-2xl p-1 shadow-sm border border-stone-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div class="absolute top-0 left-0 w-1.5 h-full bg-amplify-purple"></div>
            <div class="p-6 pl-8">
              <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-2">
                  <span class="bg-amplify-purple/10 text-amplify-purple px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">Top Priority</span>
                  <span class="text-slate-400 text-xs flex items-center gap-1"><Target :size="12" /> Google Ads Suite</span>
                </div>
                <div class="text-right">
                  <div class="text-xs text-slate-400 font-medium">Potential Impact</div>
                  <div class="text-lg font-bold text-green-600">+$420.00<span class="text-xs text-slate-400 font-normal">/mo</span></div>
                </div>
              </div>
              <h4 class="text-xl font-bold text-slate-800 mb-2">Negative Keyword Opportunity</h4>
              <p class="text-slate-500 mb-6 max-w-lg leading-relaxed">
                We've detected high spend on the term "free guitars" which has a 95% bounce rate. Blocking this will improve your ROAS immediately.
              </p>
              <div class="flex items-center gap-3 flex-wrap">
                <button class="bg-amplify-purple text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amplify-purple/20 hover:bg-amplify-purple/90 transition-all flex items-center gap-2">
                  Fix This Now <ArrowUpRight :size="16" />
                </button>
                <button class="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-stone-50 transition-colors">
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

          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mt-8">Up Next</h3>
          <div class="space-y-3">
            <div class="bg-white rounded-2xl p-4 border border-stone-100 flex items-center justify-between hover:border-amplify-green transition-colors cursor-pointer group">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <LayoutGrid :size="20" />
                </div>
                <div>
                  <h5 class="font-bold text-slate-700 group-hover:text-amplify-purple transition-colors">Facebook Ads: Low Efficiency</h5>
                  <p class="text-xs text-slate-400">Ad Set "Winter Promo" is underperforming.</p>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="text-right hidden sm:block">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">Potential Impact</div>
                  <div class="text-sm font-bold text-green-600">+$185.00/mo</div>
                </div>
                <button class="p-2 text-slate-300 hover:text-amplify-green transition-colors">
                  <ArrowUpRight :size="20" />
                </button>
              </div>
            </div>

            <div class="bg-white rounded-2xl p-4 border border-stone-100 flex items-center justify-between hover:border-amplify-green transition-colors cursor-pointer group">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-purple-50 text-amplify-purple flex items-center justify-center">
                  <Sparkles :size="20" />
                </div>
                <div>
                  <h5 class="font-bold text-slate-700 group-hover:text-amplify-purple transition-colors">Social Spark: Event Post</h5>
                  <p class="text-xs text-slate-400">Create a post for your upcoming weekend sale.</p>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="text-right hidden sm:block">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">Value</div>
                  <div class="text-sm font-bold text-slate-600">Engagement</div>
                </div>
                <button class="p-2 text-slate-300 hover:text-amplify-green transition-colors">
                  <ArrowUpRight :size="20" />
                </button>
              </div>
            </div>

            <div class="bg-white rounded-2xl p-4 border border-stone-100 flex items-center justify-between hover:border-amplify-green transition-colors cursor-pointer group">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Target :size="20" />
                </div>
                <div>
                  <h5 class="font-bold text-slate-700 group-hover:text-amplify-purple transition-colors">Local SEO: 5-Star Review</h5>
                  <p class="text-xs text-slate-400">New review from "John D." requires response.</p>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="text-right hidden sm:block">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">Value</div>
                  <div class="text-sm font-bold text-slate-600">Reputation</div>
                </div>
                <button class="p-2 text-slate-300 hover:text-amplify-green transition-colors">
                  <ArrowUpRight :size="20" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <h3 class="text-lg font-bold text-slate-800">Active Apps</h3>
          <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm space-y-6">
            <div class="flex items-start gap-4 pb-6 border-b border-stone-50">
              <div class="mt-1">
                <div class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>
              <div>
                <h4 class="font-bold text-slate-700 text-sm">Google Ads Suite</h4>
                <p class="text-xs text-slate-400 mt-1">Optimization Score: <span class="text-green-600 font-bold">84%</span></p>
                <p class="text-[10px] text-slate-400 mt-0.5">Last check: 20m ago</p>
              </div>
            </div>
            <div class="flex items-start gap-4 pb-6 border-b border-stone-50">
              <div class="mt-1">
                <div class="w-2 h-2 rounded-full bg-slate-300" />
              </div>
              <div>
                <h4 class="font-bold text-slate-700 text-sm">Social Spark</h4>
                <p class="text-xs text-slate-400 mt-1">Ready for input</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="mt-1">
                <div class="w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <div>
                <h4 class="font-bold text-slate-700 text-sm">Local SEO</h4>
                <p class="text-xs text-slate-400 mt-1">1 Review needs response</p>
              </div>
            </div>
            <button class="w-full py-3 mt-4 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-400 hover:text-amplify-purple hover:border-amplify-purple transition-colors flex items-center justify-center gap-2">
              <Zap :size="14" /> Add New Mini-App
            </button>
          </div>

          <div class="bg-amplify-purple/5 p-6 rounded-[2rem] border border-amplify-purple/10">
            <h4 class="font-bold text-amplify-purple text-sm mb-2">Did you know?</h4>
            <p class="text-xs text-slate-600 leading-relaxed">
              Optimizing your negative keywords once a week can save up to 20% of your ad budget. You're doing great!
            </p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>
