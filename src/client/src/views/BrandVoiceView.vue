<script setup lang="ts">
import { computed, ref, onMounted, watch, inject, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VueApexCharts from 'vue3-apexcharts';
import { useDateRange } from '../composables/useDateRange';
import {
  Bot,
  RefreshCw,
  Search,
  Zap,
  MessageSquare,
  ShieldAlert,
  Info,
  Target,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-vue-next';
import { INITIAL_DATA } from '../brandVoice/constants';
import type { BrandVoiceData, TrendDirection } from '../brandVoice/types';

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

const ApexChart = VueApexCharts;
const router = useRouter();
const route = useRoute();

const data = ref<BrandVoiceData>(INITIAL_DATA);
const brandVoiceSummary = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const fetchBrandVoiceSummary = async () => {
  if (!selectedAccount?.value) return;
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    const acc = selectedAccount.value;
    if (acc.id) params.append('accountId', acc.id);
    if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
    if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);
    params.append('start', dateParams.value.startDate || '');
    params.append('end', dateParams.value.endDate || '');

    const res = await fetch(`/api/brand-voice/summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch brand voice summary');
    brandVoiceSummary.value = await res.json();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchBrandVoiceSummary);
watch([selectedAccount, dateParams], fetchBrandVoiceSummary);

const trendIcon = (trend: TrendDirection) => {
  if (trend === 'up') return TrendingUp;
  if (trend === 'down') return TrendingDown;
  return Minus;
};

const radarOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
  stroke: { width: 2 },
  fill: { opacity: 0.2 },
  labels: data.value.competitorRadar.map((d) => d.attribute),
  colors: ['#6366f1', '#38bdf8', '#f59e0b'],
  yaxis: { show: false },
  legend: { position: 'bottom', labels: { colors: '#475569' } }
}));

const radarSeries = computed(() => [
  { name: 'Your Brand', data: data.value.competitorRadar.map((d) => d.me) },
  { name: 'Sweetwater', data: data.value.competitorRadar.map((d) => d.competitor1) },
  { name: 'Guitar Center', data: data.value.competitorRadar.map((d) => d.competitor2) }
]);

</script>

<template>
  <div class="h-full overflow-y-auto bg-slate-50 font-sans">
    <div class="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Bot class="text-indigo-600" :size="36" />
            Brand Voice Tracker
          </h1>
          <p class="text-slate-500 text-lg mt-1">Strategic alignment and resonance analysis across all channels.</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="fetchBrandVoiceSummary" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors">
            <RefreshCw :class="{'animate-spin': loading}" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div v-if="loading && !brandVoiceSummary" class="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw class="w-12 h-12 mb-4 animate-spin text-indigo-300" />
        <p class="font-bold">Analyzing brand presence...</p>
      </div>

      <div v-else-if="error" class="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center gap-4">
        <ShieldAlert class="w-6 h-6" />
        <p>{{ error }}</p>
      </div>

      <div v-else-if="brandVoiceSummary" class="space-y-8">
        <!-- Row 1: Strategic Alignment Metrics -->
        <section>
          <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Target class="w-4 h-4" />
            Strategic Alignment Metrics
          </h3>
          <div class="grid md:grid-cols-3 gap-6">
            <!-- Brand Voice Consistency -->
            <div class="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative group">
              <div class="flex justify-between items-start mb-4">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Consistency Score</p>
                <div class="relative group/info">
                  <Info class="w-4 h-4 text-slate-300 cursor-help group-hover/info:text-indigo-500 transition-colors" />
                  <div class="absolute bottom-full right-0 mb-2 w-64 bg-slate-900 text-white text-[10px] p-3 rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    This score shows how well your ads match your brand’s unique personality. A 100% means your content sounds exactly like your brand is supposed to; a lower score suggests your messaging might be drifting.
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-5xl font-black text-slate-900">{{ brandVoiceSummary.strategicAlignment.consistencyScore.value }}%</div>
                <div class="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div class="h-full bg-indigo-600" :style="{ width: `${brandVoiceSummary.strategicAlignment.consistencyScore.value}%` }"></div>
                </div>
              </div>
              <p class="text-[10px] text-indigo-400 font-mono mt-4 uppercase">{{ brandVoiceSummary.strategicAlignment.consistencyScore.label }}</p>
            </div>

            <!-- Sentiment Pulse -->
            <div class="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative group">
              <div class="flex justify-between items-start mb-4">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Sentiment Pulse</p>
                <div class="relative group/info">
                  <Info class="w-4 h-4 text-slate-300 cursor-help group-hover/info:text-indigo-500 transition-colors" />
                  <div class="absolute bottom-full right-0 mb-2 w-64 bg-slate-900 text-white text-[10px] p-3 rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    This tracks the 'vibe' of your audience. It tells you if people are reacting to your ads with excitement, curiosity, or frustration, helping you protect your brand reputation in real-time.
                  </div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-[10px] font-bold uppercase">
                  <span class="text-emerald-600">Positive {{ (brandVoiceSummary.strategicAlignment.sentimentPulse.positive * 100).toFixed(0) }}%</span>
                  <span class="text-slate-400">Neutral {{ (brandVoiceSummary.strategicAlignment.sentimentPulse.neutral * 100).toFixed(0) }}%</span>
                  <span class="text-rose-500">Negative {{ (brandVoiceSummary.strategicAlignment.sentimentPulse.negative * 100).toFixed(0) }}%</span>
                </div>
                <div class="h-3 rounded-full flex overflow-hidden shadow-inner border border-slate-100">
                  <div class="bg-emerald-500 h-full transition-all duration-1000" :style="{ width: `${brandVoiceSummary.strategicAlignment.sentimentPulse.positive * 100}%` }"></div>
                  <div class="bg-slate-200 h-full transition-all duration-1000" :style="{ width: `${brandVoiceSummary.strategicAlignment.sentimentPulse.neutral * 100}%` }"></div>
                  <div class="bg-rose-500 h-full transition-all duration-1000" :style="{ width: `${brandVoiceSummary.strategicAlignment.sentimentPulse.negative * 100}%` }"></div>
                </div>
              </div>
              <p class="text-[10px] text-slate-400 font-mono mt-4 uppercase">{{ brandVoiceSummary.strategicAlignment.sentimentPulse.label }}</p>
            </div>

            <!-- Vocabulary Red Flags -->
            <div class="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative group">
              <div class="flex justify-between items-start mb-4">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Vocabulary Red Flags</p>
                <div class="relative group/info">
                  <Info class="w-4 h-4 text-slate-300 cursor-help group-hover/info:text-indigo-500 transition-colors" />
                  <div class="absolute bottom-full right-0 mb-2 w-64 bg-slate-900 text-white text-[10px] p-3 rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    This is your 'Brand Safety' check. It flags any words or phrases used in your ads that don't fit your brand guidelines or that you’ve specifically asked to avoid.
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-black text-xl">
                  {{ brandVoiceSummary.strategicAlignment.redFlags.count }}
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="word in brandVoiceSummary.strategicAlignment.redFlags.flaggedWords" :key="word" 
                        class="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-bold uppercase border border-rose-100">
                    {{ word }}
                  </span>
                </div>
              </div>
              <p class="text-[10px] text-rose-400 font-mono mt-4 uppercase">{{ brandVoiceSummary.strategicAlignment.redFlags.label }}</p>
            </div>
          </div>
        </section>

        <!-- Row 2: Creative & Messaging Resonance -->
        <section>
          <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Zap class="w-4 h-4" />
            Creative & Messaging Resonance
          </h3>
          <div class="grid lg:grid-cols-3 gap-6">
            <!-- Hook Performance -->
            <div class="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h4 class="text-xl font-bold text-slate-900">"Hook" Performance Analysis</h4>
                  <p class="text-sm text-slate-500 mt-1">Average engagement velocity by opening style.</p>
                </div>
                <div class="relative group/info">
                  <Info class="w-5 h-5 text-slate-300 cursor-help group-hover/info:text-indigo-500 transition-colors" />
                  <div class="absolute bottom-full right-0 mb-2 w-72 bg-slate-900 text-white text-[10px] p-3 rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    We’ve categorized your ad 'Hooks' to show you what works best. For example, does your audience prefer 'How-to' educational openings or 'Bold' provocative statements?
                  </div>
                </div>
              </div>
              
              <div class="space-y-6">
                <div v-for="hook in brandVoiceSummary.creativeResonance.hookAnalysis" :key="hook.type" class="space-y-2">
                  <div class="flex justify-between text-xs font-bold">
                    <span class="text-slate-700 flex items-center gap-2">
                      <component :is="hook.type === 'Educational' ? Search : hook.type === 'Provocative' ? Zap : MessageSquare" class="w-3 h-3 text-indigo-400" />
                      {{ hook.type }}
                    </span>
                    <span class="text-indigo-600 font-mono">{{ (hook.avgEngagement * 100).toFixed(2) }}% Engagement</span>
                  </div>
                  <div class="h-2 rounded-full bg-slate-50 overflow-hidden border border-slate-100">
                    <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" :style="{ width: `${Math.min(hook.avgEngagement * 1000, 100)}%` }"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Visual synergy -->
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group flex flex-col">
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h4 class="text-xl font-bold text-slate-900">Visual-to-Voice Synergy</h4>
                  <p class="text-sm text-slate-500 mt-1">Alignment between creative and copy.</p>
                </div>
                <div class="relative group/info">
                  <Info class="w-5 h-5 text-slate-300 cursor-help group-hover/info:text-indigo-500 transition-colors" />
                  <div class="absolute bottom-full right-0 mb-2 w-72 bg-slate-900 text-white text-[10px] p-3 rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    This ensures your pictures and words are 'singing the same song.' It flags ads where a professional image might be paired with overly casual text, which can confuse customers.
                  </div>
                </div>
              </div>
              
              <div class="flex-1 flex flex-col items-center justify-center text-center">
                <div class="relative w-32 h-32 mb-4">
                  <svg class="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" class="text-slate-100" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" :stroke-dasharray="2 * Math.PI * 58" :stroke-dashoffset="2 * Math.PI * 58 * (1 - brandVoiceSummary.creativeResonance.visualSynergy.value / 100)" class="text-indigo-600" stroke-linecap="round" />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-3xl font-black text-slate-900">
                    {{ brandVoiceSummary.creativeResonance.visualSynergy.value }}%
                  </div>
                </div>
                <p class="text-[10px] text-indigo-400 font-mono uppercase">{{ brandVoiceSummary.creativeResonance.visualSynergy.label }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Lower Section: Competitive & Future Voice -->
        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Competitor Voice Benchmark -->
          <section class="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative group">
            <div class="flex justify-between items-start mb-6">
              <div>
                <h4 class="text-2xl font-black text-slate-900 uppercase italic">Competitor Benchmark</h4>
                <p class="text-sm text-slate-500">Semantic distance calculation vs market leaders.</p>
              </div>
              <div class="relative group/info">
                <Info class="w-5 h-5 text-slate-300 cursor-help group-hover/info:text-indigo-500 transition-colors" />
                <div class="absolute bottom-full right-0 mb-2 w-72 bg-slate-900 text-white text-[10px] p-3 rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                  See how your voice compares to the competition. This helps you identify 'Empty Space' in the market where you can sound unique and gain more attention.
                </div>
              </div>
            </div>
            
            <div class="aspect-square max-w-xs mx-auto">
              <ApexChart type="radar" height="100%" :options="radarOptions" :series="radarSeries" />
            </div>
            <p class="text-[10px] text-center text-indigo-400 font-mono uppercase mt-4">{{ brandVoiceSummary.competitiveFuture.competitorBenchmark.label }}</p>
          </section>

          <!-- Predicted Resonance (AI Sandbox) -->
          <section class="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div class="relative z-10">
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h4 class="text-2xl font-black uppercase italic text-amplify-green">AI Sandbox</h4>
                  <p class="text-sm text-slate-400">Predict success based on historical resonance.</p>
                </div>
                <div class="relative group/info">
                  <Info class="w-5 h-5 text-slate-500 cursor-help group-hover/info:text-amplify-green transition-colors" />
                  <div class="absolute bottom-full right-0 mb-2 w-72 bg-white text-slate-900 text-[10px] p-3 rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                    Your 'Creative Sandbox.' Paste your ad copy here before you launch to see a prediction of how well it will resonate with your audience based on everything we've learned so far.
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <textarea 
                  class="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-amplify-green/50 outline-none transition-all placeholder-slate-600"
                  placeholder="Paste your proposed ad copy here to test resonance..."
                ></textarea>
                
                <div class="flex items-center justify-between">
                  <div class="flex gap-2">
                    <span class="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model V1.4</span>
                    <span class="px-3 py-1 bg-amplify-green/10 text-amplify-green rounded-full text-[10px] font-bold uppercase tracking-widest border border-amplify-green/20">Ready</span>
                  </div>
                  <button class="px-6 py-2 bg-amplify-green text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-lg shadow-amplify-green/10">
                    Test Copy
                  </button>
                </div>

                <div class="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 italic text-slate-400 text-xs text-center">
                  {{ brandVoiceSummary.competitiveFuture.predictedResonance.label }}
                </div>
              </div>
            </div>
            <!-- Decorative background -->
            <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
            <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-amplify-green/5 rounded-full blur-[80px]"></div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>