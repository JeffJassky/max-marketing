<script setup lang="ts">
import { computed, ref } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import {
  Activity,
  ArrowRight,
  BarChart2,
  Bot,
  Download,
  Globe,
  Hash,
  LineChart,
  Minus,
  Monitor,
  LayoutDashboard,
  Terminal,
  TrendingDown,
  TrendingUp,
  Zap,
  MessageSquare
} from 'lucide-vue-next';
import { INITIAL_DATA, COMPETITOR_TRENDS } from '../brandVoice/constants';
import type { BrandVoiceData, SubScore, TrendDirection } from '../brandVoice/types';

const ApexChart = VueApexCharts;

const data = ref<BrandVoiceData>(INITIAL_DATA);
const mode = ref<'focus' | 'executive'>('focus');
const activeTab = ref<'overview' | 'ai-insights' | 'deep-dive' | 'actions'>('overview');
const timeRange = ref<'max' | '90d' | 'mtd'>('max');

const subScores = computed(() => Object.values(data.value.subScores));
const isFocus = computed(() => mode.value === 'focus');

const trendIcon = (trend: TrendDirection) => {
  if (trend === 'up') return TrendingUp;
  if (trend === 'down') return TrendingDown;
  return Minus;
};

const trendTone = (trend: TrendDirection) => {
  if (trend === 'up') return 'text-emerald-500';
  if (trend === 'down') return 'text-rose-500';
  return 'text-slate-400';
};

const formatNumber = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
};

const generateSparkline = (score: number) => {
  const base = score;
  return Array.from({ length: 12 }, (_, i) => base + Math.sin(i) * 6 + (i % 3 - 1) * 2);
};

const subScoreOptions = (sub: SubScore) => {
  const colors: Record<string, string> = {
    Search: '#6366f1',
    Social: '#ec4899',
    Reviews: '#f59e0b',
    Website: '#0ea5e9'
  };
  return {
    chart: { type: 'area', sparkline: { enabled: true }, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 3 },
    colors: [colors[sub.name] || '#6366f1'],
    fill: { gradient: { enabled: true, opacityFrom: 0.4, opacityTo: 0.05 } },
    tooltip: { enabled: false }
  };
};

const subScoreSeries = (sub: SubScore) => [{ name: sub.name, data: generateSparkline(sub.score) }];

const bviSeries = computed(() => [{ name: 'BVI', data: generateSparkline(data.value.bvi.value) }]);

const bviOptions = computed(() => ({
  chart: { type: 'area', toolbar: { show: false }, sparkline: { enabled: true } },
  stroke: { curve: 'smooth', width: 4 },
  fill: { gradient: { enabled: true, opacityFrom: isFocus.value ? 0.5 : 0.25, opacityTo: 0.05 } },
  colors: [isFocus.value ? '#7c3aed' : '#c3fd34'],
  tooltip: { enabled: false }
}));

const competitorTrendOptions = computed(() => ({
  chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
  stroke: { curve: 'smooth', width: 3 },
  grid: { strokeDashArray: 3, borderColor: isFocus.value ? '#e7e5e4' : '#1f2937' },
  legend: { position: 'top', labels: { colors: isFocus.value ? '#475569' : '#cbd5e1' } },
  xaxis: { categories: COMPETITOR_TRENDS.map((d) => d.month), labels: { style: { colors: isFocus.value ? '#94a3b8' : '#94a3b8' } } },
  yaxis: { labels: { style: { colors: isFocus.value ? '#94a3b8' : '#cbd5e1' } } },
  colors: ['#c3fd34', '#38bdf8', '#f472b6', '#a855f7'],
  tooltip: { shared: true }
}));

const competitorTrendSeries = computed(() => [
  { name: "George's Music", data: COMPETITOR_TRENDS.map((d) => d.georgesMusic) },
  { name: 'Sweetwater', data: COMPETITOR_TRENDS.map((d) => d.sweetwater) },
  { name: 'Guitar Center', data: COMPETITOR_TRENDS.map((d) => d.guitarCenter) },
  { name: 'Reverb', data: COMPETITOR_TRENDS.map((d) => d.reverb) }
]);

const radarOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
  stroke: { width: 2 },
  fill: { opacity: 0.2 },
  labels: data.value.competitorRadar.map((d) => d.attribute),
  colors: ['#c3fd34', '#6366f1', '#f59e0b'],
  yaxis: { show: false },
  legend: { position: 'bottom', labels: { colors: isFocus.value ? '#475569' : '#cbd5e1' } }
}));

const radarSeries = computed(() => [
  { name: 'George\'s Music', data: data.value.competitorRadar.map((d) => d.me) },
  { name: 'Sweetwater', data: data.value.competitorRadar.map((d) => d.competitor1) },
  { name: 'Guitar Center', data: data.value.competitorRadar.map((d) => d.competitor2) }
]);

const hallucinRiskTone = computed(() => {
  if (data.value.aiInsights.hallucinationRisk === 'High') return 'text-rose-500';
  if (data.value.aiInsights.hallucinationRisk === 'Medium') return 'text-amber-400';
  return 'text-emerald-500';
});

const syntheticQueries = computed(() => data.value.subScores.search.syntheticQueries || []);
const recommendations = computed(() =>
  subScores.value.flatMap((sub) => sub.recommendations.map((rec) => ({ ...rec, channel: sub.name })))
);

const downloadReport = () => window.print();
</script>

<template>
  <div class="h-full overflow-y-auto" :class="isFocus ? 'bg-stone-50' : 'bg-amplify-darker text-slate-100'">
    <div class="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div
        class="text-xs font-bold py-2 px-4 rounded-lg text-center tracking-wide flex items-center justify-center gap-2 mx-auto max-w-2xl transition-all"
        :class="isFocus
          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
          : 'bg-slate-900 border border-amplify-green/30 text-amplify-green font-mono shadow-[0_0_15px_rgba(195,253,52,0.1)]'"
      >
        <Zap class="w-3 h-3" />
        <span v-if="isFocus">TRIAL MODE ACTIVE • Service provided free until end of Q4 2025</span>
        <span v-else>[SYSTEM_NOTICE]: TRIAL_LICENSE_ACTIVE // EXPIRATION: Q4_2025</span>
      </div>

      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="mb-2" :class="isFocus ? 'text-4xl font-black text-slate-900' : 'text-3xl font-mono font-black text-white uppercase'">
            {{ isFocus ? 'Welcome back, Alex.' : '> USER: ALEX_ADMIN' }}
          </h1>
          <p :class="isFocus ? 'text-slate-500 text-lg' : 'text-slate-400 font-mono text-sm'">
            {{ isFocus ? 'Here is your marketing focus for today.' : '[SESSION_ID]: 8473-XJ9 // ESTABLISHING UPLINK...' }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center bg-slate-900 p-1 rounded-full border border-slate-700 shadow-sm">
            <button
              class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              :class="isFocus ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-200'"
              @click="mode = 'focus'"
            >
              <Monitor class="w-3 h-3" />
              L3
            </button>
            <button
              class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              :class="!isFocus ? 'bg-amplify-green text-slate-900 shadow-[0_0_10px_rgba(195,253,52,0.3)]' : 'text-slate-500 hover:text-slate-200'"
              @click="mode = 'executive'"
            >
              <Terminal class="w-3 h-3" />
              D3
            </button>
          </div>
          <button
            class="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg group"
            :class="isFocus
              ? 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-xl'
              : 'bg-slate-900 border border-amplify-green text-amplify-green hover:bg-amplify-green hover:text-slate-900 font-mono'"
            @click="downloadReport"
          >
            <span>{{ isFocus ? 'Download Report' : 'EXPORT_LOGS' }}</span>
            <Download class="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <div class="flex space-x-4 border-b border-transparent overflow-x-auto pb-2">
        <button
          v-for="tab in ['overview', 'ai-insights', 'deep-dive', 'actions']"
          :key="tab"
          class="relative px-6 py-3 text-sm font-bold transition-all whitespace-nowrap overflow-hidden shrink-0 group"
          :class="isFocus
            ? ['overview', 'ai-insights', 'deep-dive', 'actions'].includes(tab as string) && activeTab === tab
              ? 'rounded-full bg-amplify-purple text-white shadow-lg shadow-amplify-purple/20'
              : 'rounded-full bg-white text-slate-500 hover:bg-stone-100'
            : activeTab === tab
              ? 'border-b-2 border-amplify-green text-amplify-green bg-amplify-green/5'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-300'"
          @click="activeTab = tab as typeof activeTab.value"
        >
          <div class="flex items-center gap-2">
            <LayoutDashboard v-if="tab === 'overview'" class="w-4 h-4" />
            <Bot v-else-if="tab === 'ai-insights'" class="w-4 h-4" />
            <BarChart2 v-else-if="tab === 'deep-dive'" class="w-4 h-4" />
            <Zap v-else class="w-4 h-4" />
            <span :class="!isFocus ? 'uppercase font-mono' : ''">{{ tab === 'ai-insights' ? 'AI Intelligence' : (tab as string).replace('-', ' ') }}</span>
          </div>
        </button>
      </div>

      <div v-if="activeTab === 'overview'" class="space-y-8">
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="col-span-2 bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden" :class="!isFocus ? 'bg-slate-900 border-slate-800 text-slate-100' : ''">
            <div class="p-8 pb-4 flex justify-between items-start">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Brand Voice Index</p>
                <div class="flex items-end gap-4">
                  <span class="text-6xl font-black tracking-tight" :class="isFocus ? 'text-slate-900' : 'text-white'">{{ data.bvi.value }}</span>
                  <div class="flex items-center gap-2 px-3 py-1.5 rounded-full" :class="data.bvi.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : data.bvi.trend === 'down' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'">
                    <component :is="trendIcon(data.bvi.trend)" class="w-4 h-4" />
                    <span class="text-xs font-bold">{{ data.bvi.percentageChange }}%</span>
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  v-for="range in ['max', '90d', 'mtd']"
                  :key="range"
                  class="px-3 py-1 rounded-full text-xs font-bold"
                  :class="timeRange === range ? 'bg-amplify-purple text-white' : 'bg-stone-100 text-slate-500'
                  "
                  @click="timeRange = range as typeof timeRange.value"
                >
                  {{ range.toUpperCase() }}
                </button>
              </div>
            </div>
            <div class="px-6 pb-6">
              <ApexChart type="area" height="160" :options="bviOptions" :series="bviSeries" />
            </div>
            <div class="px-8 pb-8 text-sm text-slate-500" :class="!isFocus ? 'text-slate-300' : ''">
              {{ data.narrative }}
            </div>
          </div>

          <div class="bg-white rounded-[2rem] border border-stone-100 shadow-sm p-6 space-y-4" :class="!isFocus ? 'bg-slate-900 border-slate-800 text-slate-100' : ''">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">AI Visibility</p>
                <p class="text-4xl font-black" :class="isFocus ? 'text-slate-900' : 'text-white'">{{ data.aiInsights.overallVisibility }}%</p>
                <p class="text-sm" :class="['text-slate-500', hallucinRiskTone].join(' ')">Hallucination Risk: {{ data.aiInsights.hallucinationRisk }}</p>
              </div>
              <div class="w-16 h-16 rounded-2xl bg-amplify-purple/10 text-amplify-purple flex items-center justify-center">
                <Bot class="w-8 h-8" />
              </div>
            </div>
            <div class="space-y-3">
              <div
                v-for="model in data.aiInsights.models"
                :key="model.name"
                class="flex items-center gap-3"
              >
                <div class="w-20 text-xs font-bold uppercase tracking-wide" :class="!isFocus ? 'text-slate-300' : 'text-slate-500'">{{ model.name }}</div>
                <div class="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden" :class="!isFocus ? 'bg-slate-800' : ''">
                  <div class="h-full bg-amplify-purple" :style="{ width: `${model.shareOfModel}%` }"></div>
                </div>
                <span class="text-sm font-bold" :class="trendTone(model.trend)">{{ model.shareOfModel }}%</span>
              </div>
            </div>
            <div class="p-4 rounded-xl border" :class="isFocus ? 'border-stone-200 bg-stone-50' : 'border-slate-800 bg-slate-900'">
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Narrative Check</p>
              <p class="text-sm leading-relaxed" :class="!isFocus ? 'text-slate-200' : 'text-slate-600'">
                Tone: <span class="font-semibold">{{ data.aiInsights.narrativeAnalysis.tone }}</span> • Accuracy: <span class="font-semibold">{{ data.aiInsights.narrativeAnalysis.accuracy }}%</span>
              </p>
              <p class="text-xs text-slate-500 mt-1" :class="!isFocus ? 'text-slate-300' : ''">Missing topics: {{ data.aiInsights.narrativeAnalysis.missingTopics.join(', ') }}</p>
            </div>
          </div>
        </div>

        <div class="grid lg:grid-cols-4 gap-6">
          <div
            v-for="sub in subScores"
            :key="sub.slug"
            class="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm p-6 flex flex-col gap-4 hover:-translate-y-1 transition"
            :class="!isFocus ? 'bg-slate-900 border-slate-800 text-slate-100' : ''"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{{ sub.name }} Intelligence</p>
                <div class="flex items-center gap-3">
                  <span class="text-4xl font-black" :class="isFocus ? 'text-slate-900' : 'text-white'">{{ sub.score }}</span>
                  <div class="flex items-center gap-1 px-2 py-1 rounded-lg" :class="sub.trend.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : sub.trend.trend === 'down' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'">
                    <component :is="trendIcon(sub.trend.trend)" class="w-4 h-4" />
                    <span class="text-xs font-bold">{{ Math.abs(sub.trend.percentageChange) }}%</span>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Impact</p>
                <p class="text-sm font-bold" :class="isFocus ? 'text-slate-900' : 'text-slate-200'">{{ sub.weight }}%</p>
              </div>
            </div>
            <ApexChart type="area" height="90" :options="subScoreOptions(sub)" :series="subScoreSeries(sub)" />
            <p class="text-sm leading-relaxed" :class="!isFocus ? 'text-slate-200' : 'text-slate-600'">{{ sub.details }}</p>
            <a :href="`#/brand-voice/${sub.slug}`" class="flex items-center gap-2 text-sm font-bold text-amplify-purple hover:text-amplify-purple/80">
              Analyze {{ sub.name }}
              <ArrowRight class="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'ai-insights'" class="grid lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm p-6 space-y-4" :class="!isFocus ? 'bg-slate-900 border-slate-800 text-slate-100' : ''">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Model Share of Voice</p>
              <p class="text-lg text-slate-500" :class="!isFocus ? 'text-slate-300' : ''">Visibility across LLMs</p>
            </div>
            <MessageSquare class="w-6 h-6 text-amplify-purple" />
          </div>
          <div class="space-y-4">
            <div v-for="model in data.aiInsights.models" :key="model.name" class="p-4 rounded-xl border" :class="isFocus ? 'border-stone-200 bg-stone-50' : 'border-slate-800 bg-slate-950/40'">
              <div class="flex items-center justify-between mb-2">
                <span class="font-semibold">{{ model.name }}</span>
                <span class="text-xs font-bold" :class="trendTone(model.trend)">{{ model.trend === 'up' ? '▲' : model.trend === 'down' ? '▼' : '•' }} {{ model.shareOfModel }}%</span>
              </div>
              <div class="flex items-center gap-3 text-sm text-slate-500" :class="!isFocus ? 'text-slate-300' : ''">
                <div class="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden" :class="!isFocus ? 'bg-slate-800' : ''">
                  <div class="h-full" :class="isFocus ? 'bg-amplify-purple' : 'bg-amplify-green'" :style="{ width: `${model.shareOfModel}%` }"></div>
                </div>
                <span class="text-xs px-2 py-1 rounded-full" :class="isFocus ? 'bg-white text-slate-700' : 'bg-slate-900 text-slate-100'">Sentiment {{ model.sentiment }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm p-6" :class="!isFocus ? 'bg-slate-900 border-slate-800 text-slate-100' : ''">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Citations</p>
              <p class="text-lg text-slate-500" :class="!isFocus ? 'text-slate-300' : ''">Sources LLMs reference</p>
            </div>
            <Hash class="w-6 h-6 text-amplify-purple" />
          </div>
          <div class="space-y-3">
            <div v-for="citation in data.aiInsights.citations" :key="citation.source" class="flex items-center justify-between p-3 rounded-xl" :class="isFocus ? 'bg-stone-50' : 'bg-slate-950/40 border border-slate-800'">
              <div>
                <p class="font-semibold">{{ citation.source }}</p>
                <p class="text-xs uppercase tracking-[0.2em] text-slate-400">{{ citation.type }}</p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold">{{ citation.count }}</p>
                <p class="text-xs text-slate-500" :class="!isFocus ? 'text-slate-300' : ''">Authority {{ citation.authority }}%</p>
              </div>
            </div>
          </div>
          <div class="mt-6 p-4 rounded-xl border" :class="isFocus ? 'border-stone-200 bg-white' : 'border-slate-800 bg-slate-950/40'">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Narrative Gaps</p>
            <p class="text-sm text-slate-500" :class="!isFocus ? 'text-slate-300' : ''">{{ data.aiInsights.narrativeAnalysis.missingTopics.join(' • ') }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'deep-dive'" class="space-y-6">
        <div class="grid md:grid-cols-3 gap-4">
          <div v-for="metric in [data.deepDive.totalSearchVelocity, data.deepDive.websiteTraffic, data.deepDive.socialViews]" :key="metric.value" class="p-5 rounded-xl border" :class="isFocus ? 'bg-white border-stone-100 shadow-sm' : 'bg-slate-900 border-slate-800'">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <div class="w-2 h-2 rounded-full" :class="metric.trend === 'up' ? 'bg-emerald-400' : metric.trend === 'down' ? 'bg-rose-400' : 'bg-slate-400'"></div>
                <span>Trend</span>
              </div>
              <LineChart class="w-4 h-4 text-amplify-purple" />
            </div>
            <p class="text-3xl font-black" :class="isFocus ? 'text-slate-900' : 'text-white'">{{ formatNumber(metric.value) }}</p>
            <p class="text-sm font-bold" :class="trendTone(metric.trend)">{{ metric.trend === 'up' ? '▲' : metric.trend === 'down' ? '▼' : '•' }} {{ metric.percentageChange }}%</p>
          </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-6">
          <div class="p-6 rounded-[1.5rem] border" :class="isFocus ? 'bg-white border-stone-100 shadow-sm' : 'bg-slate-900 border-slate-800'">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-xs uppercase font-bold tracking-[0.2em] text-slate-400">Competitive Share</p>
                <p class="text-lg text-slate-500" :class="!isFocus ? 'text-slate-300' : ''">Awareness over time</p>
              </div>
              <Activity class="w-5 h-5 text-amplify-purple" />
            </div>
            <ApexChart type="line" height="260" :options="competitorTrendOptions" :series="competitorTrendSeries" />
          </div>

          <div class="p-6 rounded-[1.5rem] border" :class="isFocus ? 'bg-white border-stone-100 shadow-sm' : 'bg-slate-900 border-slate-800'">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-xs uppercase font-bold tracking-[0.2em] text-slate-400">Positioning Radar</p>
                <p class="text-lg text-slate-500" :class="!isFocus ? 'text-slate-300' : ''">Strength vs competitors</p>
              </div>
              <Globe class="w-5 h-5 text-amplify-purple" />
            </div>
            <ApexChart type="radar" height="260" :options="radarOptions" :series="radarSeries" />
          </div>
        </div>
      </div>

      <div v-else class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 p-6 rounded-[1.5rem] border" :class="isFocus ? 'bg-white border-stone-100 shadow-sm' : 'bg-slate-900 border-slate-800'">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-xs uppercase font-bold tracking-[0.2em] text-slate-400">Synthetic Queries</p>
              <p class="text-lg text-slate-500" :class="!isFocus ? 'text-slate-300' : ''">Recent LLM answers about you</p>
            </div>
            <BarChart2 class="w-5 h-5 text-amplify-purple" />
          </div>
          <div class="space-y-3">
            <div
              v-for="query in syntheticQueries"
              :key="query.query"
              class="p-4 rounded-xl border"
              :class="isFocus ? 'bg-stone-50 border-stone-100' : 'bg-slate-950/40 border-slate-800'"
            >
              <div class="flex justify-between items-start gap-4">
                <div>
                  <p class="text-sm font-semibold" :class="isFocus ? 'text-slate-900' : 'text-white'">{{ query.query }}</p>
                  <p class="text-xs text-slate-500 mt-1" :class="!isFocus ? 'text-slate-300' : ''">{{ query.snippet }}</p>
                </div>
                <div class="text-right text-xs uppercase tracking-[0.2em] text-slate-400">
                  <div>{{ query.model }}</div>
                  <div class="font-bold" :class="trendTone(query.sentiment === 'Positive' ? 'up' : query.sentiment === 'Negative' ? 'down' : 'neutral')">{{ query.sentiment }}</div>
                  <div class="text-slate-500" :class="!isFocus ? 'text-slate-300' : ''">Rank: {{ query.rank ?? 'N/A' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-[1.5rem] border space-y-4" :class="isFocus ? 'bg-white border-stone-100 shadow-sm' : 'bg-slate-900 border-slate-800'">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs uppercase font-bold tracking-[0.2em] text-slate-400">Recommended Actions</p>
              <p class="text-lg text-slate-500" :class="!isFocus ? 'text-slate-300' : ''">Ranked by impact</p>
            </div>
            <Zap class="w-5 h-5 text-amplify-purple" />
          </div>
          <div class="space-y-3">
            <div
              v-for="rec in recommendations"
              :key="rec.id"
              class="p-4 rounded-xl border"
              :class="isFocus ? 'border-stone-200 bg-stone-50' : 'border-slate-800 bg-slate-950/40'"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-bold" :class="isFocus ? 'text-slate-900' : 'text-white'">{{ rec.title }}</span>
                <span class="text-[10px] px-2 py-1 rounded-full font-bold" :class="rec.impact === 'High' ? 'bg-rose-100 text-rose-600' : rec.impact === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'">{{ rec.impact }}</span>
              </div>
              <p class="text-xs text-slate-500 mb-2" :class="!isFocus ? 'text-slate-300' : ''">{{ rec.description }}</p>
              <div class="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                <span>{{ rec.channel }}</span>
                <span>{{ rec.type }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
