<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, inject, computed, type Ref } from 'vue';
import {
  Award,
  Trophy,
  Medal,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Flame,
  Calendar,
  ChevronDown,
  Sparkles,
  FileText,
  GripVertical,
  Trash2,
  CheckCircle2,
  Send,
  Bold,
  Italic,
  Link as LinkIcon,
  Heading1,
  Heading2,
  List,
  Quote
} from 'lucide-vue-next';
import draggable from 'vuedraggable';
import { marked } from 'marked';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { BubbleMenu } from '@tiptap/vue-3/menus';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import Placeholder from '@tiptap/extension-placeholder';

// Report Block Components
import HeroBlock from '../components/report-blocks/HeroBlock.vue';
import MetricBlock from '../components/report-blocks/MetricBlock.vue';
import ChartBlock from '../components/report-blocks/ChartBlock.vue';
import InsightBlock from '../components/report-blocks/InsightBlock.vue';
import NarrativeBlock from '../components/report-blocks/NarrativeBlock.vue';

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

interface Superlative {
  report_date: string;
  period_label: string;
  account_id: string;
  time_period: string;
  entity_type: string;
  entity_label?: string;
  dimension: string;
  item_name: string;
  item_id: string;
  metric_name: string;
  metric_value: number;
  rank_type: string;
  position: number;
  // Enriched
  previous_position?: number;
  rank_delta?: number;
  peak_position?: number;
  periods_on_chart?: number;
  thumbnail_url?: string;
  awards?: { id: string; emoji: string; label: string; description: string; }[];
}

const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');
const loading = ref(false);
const superlatives = ref<Superlative[]>([]);
const availableMonths = ref<{ period_label: string; period_start: string }[]>([]);
const selectedMonth = ref<string>('');
const error = ref<string | null>(null);

// Report Generation State
interface TalkingPoint {
  title: string;
  victory: string;
  proof: string;
  impact: string;
  insights: string;
  referenced_superlative_index?: number;
}

const talkingPoints = ref<TalkingPoint[]>([]);
const selectedTalkingPoints = ref<TalkingPoint[]>([]);
const isGeneratingTalkingPoints = ref(false);
const isGeneratingDraft = ref(false);
const reportData = ref<{ report_title: string; blocks: any[] } | null>(null);
const showReportGenerator = ref(false);

const generateTalkingPoints = async () => {
  if (superlatives.value.length === 0) return;
  
  isGeneratingTalkingPoints.value = true;
  talkingPoints.value = [];
  selectedTalkingPoints.value = [];
  reportData.value = null;
  
  try {
    const res = await fetch('/api/reports/generate-talking-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ superlatives: superlatives.value })
    });
    
    if (!res.ok) throw new Error('Failed to generate concepts');
    talkingPoints.value = await res.json();
  } catch (err: any) {
    console.error(err);
    error.value = err.message || 'Failed to generate report concepts';
  } finally {
    isGeneratingTalkingPoints.value = false;
  }
};

const toggleTalkingPoint = (tp: TalkingPoint) => {
  const index = selectedTalkingPoints.value.indexOf(tp);
  if (index > -1) {
    selectedTalkingPoints.value.splice(index, 1);
  } else {
    selectedTalkingPoints.value.push(tp);
  }
};

const removeSelectedTalkingPoint = (index: number) => {
  selectedTalkingPoints.value.splice(index, 1);
};

const generateDraft = async () => {
  if (selectedTalkingPoints.value.length === 0) return;
  
  isGeneratingDraft.value = true;
  
  try {
    const res = await fetch('/api/reports/generate-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ talkingPoints: selectedTalkingPoints.value })
    });
    
    if (!res.ok) throw new Error('Failed to generate draft');
    reportData.value = await res.json();
  } catch (err: any) {
    console.error(err);
    error.value = err.message || 'Failed to generate report draft';
  } finally {
    isGeneratingDraft.value = false;
  }
};

const loadMonths = async () => {
  try {
    const res = await fetch('/api/reports/superlatives/months');
    if (res.ok) {
      availableMonths.value = await res.json();
      if (availableMonths.value.length > 0 && !selectedMonth.value) {
        selectedMonth.value = availableMonths.value[0].period_label;
      }
    }
  } catch (err) {
    console.error('Failed to load months', err);
  }
};

const loadSuperlatives = async () => {
  if (!selectedAccount?.value) {
    superlatives.value = [];
    return;
  }

  const { id, googleAdsId, facebookAdsId, ga4Id, shopifyId, instagramId, facebookPageId } = selectedAccount.value;
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    if (id) params.append('accountId', id);
    if (googleAdsId) params.append('googleAdsId', googleAdsId);
    if (facebookAdsId) params.append('facebookAdsId', facebookAdsId);
    if (ga4Id) params.append('ga4Id', ga4Id);
    if (shopifyId) params.append('shopifyId', shopifyId);
    if (instagramId) params.append('instagramId', instagramId);
    if (facebookPageId) params.append('facebookPageId', facebookPageId);
    if (selectedMonth.value) params.append('month', selectedMonth.value);

    const res = await fetch(`/api/reports/superlatives?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch superlatives');

    superlatives.value = await res.json();
  } catch (err: any) {
    console.error(err);
    error.value = err.message || 'Failed to load data';
  } finally {
    loading.value = false;
  }
};

const groupedSuperlatives = computed(() => {
  const entities: Record<string, any> = {};

  superlatives.value.forEach(item => {
    if (!entities[item.entity_type]) {
      entities[item.entity_type] = {
        id: item.entity_type,
        name: item.entity_label || item.entity_type,
        highlights: {}
      };
    }

    const highlightKey = `${item.metric_name}_${item.dimension}_${item.rank_type}`;
    if (!entities[item.entity_type].highlights[highlightKey]) {
      entities[item.entity_type].highlights[highlightKey] = {
        metric: item.metric_name,
        dimension: item.dimension,
        rankType: item.rank_type,
        winners: []
      };
    }
    entities[item.entity_type].highlights[highlightKey].winners.push(item);
  });

  return Object.values(entities)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(entity => ({
      ...entity,
      highlights: Object.values(entity.highlights).sort((a: any, b: any) => {
        const prio = (m: string) => {
          if (m.toLowerCase() === 'roas') return 0;
          if (m.toLowerCase() === 'cpa') return 1;
          if (m.includes('value')) return 2;
          return 3;
        };
        return prio(a.metric) - prio(b.metric) || a.metric.localeCompare(b.metric);
      }).map((h: any) => ({
        ...h,
        winners: h.winners.sort((a: any, b: any) => (a.position || 1) - (b.position || 1))
      }))
    }));
});

const formatHighlightTitle = (highlight: any) => {
  const metric = formatMetricName(highlight.metric);
  const dimension = highlight.dimension; // Use label from API directly
  const type = highlight.rankType === 'highest' ? 'Top' : 'Lowest';
  return `${type} ${dimension}s by ${metric}`;
};

const formatItemName = (name: string) => {
  if (name.toLowerCase() === 'facebook') return 'Meta/Facebook';
  if (name.toLowerCase() === 'google') return 'Google Ads';
  return name;
};

const formatMetricName = (name: string) => {
  if (name.toLowerCase() === 'roas') return 'ROAS';
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatValue = (metric: string, value: number) => {
  if (metric.toLowerCase() === 'roas') {
    return `${value.toFixed(1)}x`;
  }
  if (metric.includes('spend') || metric.includes('cost') || metric.includes('value') || metric.includes('volume')) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
  return new Intl.NumberFormat('en-US').format(value);
};

const getRankIcon = (pos: number = 1) => {
  if (pos === 1) return Trophy;
  if (pos === 2) return Medal;
  if (pos === 3) return Award;
  return Star;
};

const getRankColor = (pos: number = 1) => {
  if (pos === 1) return 'text-yellow-500 bg-yellow-50';
  if (pos === 2) return 'text-slate-400 bg-slate-50';
  if (pos === 3) return 'text-amber-600 bg-amber-50';
  return 'text-amplify-purple bg-amplify-purple/5';
};

const formatMonth = (label: string) => {
  if (!label) return '';
  const [year, month] = label.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
};

onMounted(async () => {
  await loadMonths();
  if (selectedAccount?.value) loadSuperlatives();
});

watch([() => selectedAccount?.value, selectedMonth], () => {
  loadSuperlatives();
});
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
    <section
      class="p-8 font-sans animate-in fade-in duration-500 overflow-y-auto h-full pb-20"
    >
      <!-- Header -->
      <div
        class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 class="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Trophy class="text-yellow-500" :size="32" />
            Charts
          </h1>
          <p class="text-slate-500 mt-2 max-w-2xl">
            Tracking the top performers and market movers across your
            advertising ecosystem.
          </p>
        </div>

        <div class="flex items-center gap-4">
          <!-- Report Generator Toggle -->
          <button
            @click="showReportGenerator = !showReportGenerator"
            class="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm"
            :class="showReportGenerator ? 'bg-amplify-purple text-white shadow-indigo-200' : 'bg-white text-slate-700 border border-stone-200 hover:border-amplify-purple hover:text-amplify-purple'"
          >
            <Sparkles :size="18" :class="showReportGenerator ? 'animate-pulse' : ''" />
            {{ showReportGenerator ? 'Hide Report Builder' : 'Build Report' }}
          </button>

          <!-- Month Selector -->
          <div class="relative group">
            <label
              class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1"
            >Chart Period</label>
            <div class="relative">
              <select
                v-model="selectedMonth"
                class="appearance-none bg-white border border-stone-200 text-slate-700 font-bold py-2.5 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amplify-purple/20 focus:border-amplify-purple transition-all cursor-pointer min-w-[180px]"
              >
                <option
                  v-for="m in availableMonths"
                  :key="m.period_label"
                  :value="m.period_label"
                >
                  {{ formatMonth(m.period_label) }}
                </option>
              </select>
              <ChevronDown
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                :size="18"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Report Generator Panel -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-4 opacity-0"
      >
        <div v-if="showReportGenerator" class="mb-12 space-y-6">
          <div class="bg-white rounded-[2rem] border border-indigo-100 shadow-xl shadow-indigo-50/50 overflow-hidden">
            <div class="p-8 bg-gradient-to-br from-indigo-50/50 to-white border-b border-indigo-50">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Sparkles class="text-white" :size="24" />
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-slate-800">AI Report Builder</h2>
                    <p class="text-sm text-slate-500 font-medium">Transform chart data into executive success stories</p>
                  </div>
                </div>
                <button 
                  v-if="talkingPoints.length === 0 && !isGeneratingTalkingPoints"
                  @click="generateTalkingPoints"
                  class="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                >
                  <Sparkles :size="18" />
                  Analyze Performance
                </button>
              </div>
            </div>

            <!-- Analysis State -->
            <div v-if="isGeneratingTalkingPoints" class="p-20 flex flex-col items-center justify-center gap-4">
              <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p class="font-bold text-slate-400 animate-pulse">Gemini is analyzing {{ superlatives.length }} data points...</p>
            </div>

            <!-- Talking Points Selection -->
            <div v-else-if="talkingPoints.length > 0 && !reportData" class="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <!-- Concepts Pool -->
              <div class="p-8 border-r border-stone-100 bg-stone-50/30">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider text-xs">
                    Analysis Results
                    <span class="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px]">{{ talkingPoints.length }}</span>
                  </h3>
                  <p class="text-[10px] font-bold text-slate-400">SELECT POINTS TO INCLUDE</p>
                </div>
                
                <div class="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  <div 
                    v-for="(tp, idx) in talkingPoints" 
                    :key="idx"
                    @click="toggleTalkingPoint(tp)"
                    class="p-4 rounded-2xl border-2 cursor-pointer transition-all group relative"
                    :class="selectedTalkingPoints.includes(tp) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:border-stone-200'"
                  >
                    <div class="flex items-start gap-3">
                      <div class="mt-1">
                        <div v-if="selectedTalkingPoints.includes(tp)" class="text-indigo-600">
                          <CheckCircle2 :size="20" fill="currentColor" class="text-indigo-50" />
                        </div>
                        <div v-else class="w-5 h-5 rounded-full border-2 border-stone-200 group-hover:border-stone-300"></div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ tp.title }}</h4>
                        <p class="text-xs text-slate-500 line-clamp-2 mt-1">{{ tp.victory }}</p>
                        <div class="mt-2 flex items-center gap-2">
                          <span class="text-[9px] font-black bg-white border border-stone-100 px-1.5 py-0.5 rounded text-slate-400 uppercase">
                            {{ tp.proof.length > 30 ? 'High Impact' : 'Data Insight' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Selected / Reorder -->
              <div class="p-8 flex flex-col h-full bg-white">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider text-xs">
                    Report Structure
                    <span v-if="selectedTalkingPoints.length" class="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[10px] animate-in zoom-in">{{ selectedTalkingPoints.length }}</span>
                  </h3>
                  <p class="text-[10px] font-bold text-slate-400">DRAG TO REORDER</p>
                </div>

                <div v-if="selectedTalkingPoints.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-stone-100 rounded-[2rem]">
                  <div class="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                    <FileText class="text-stone-300" :size="32" />
                  </div>
                  <h4 class="font-bold text-slate-400">No items selected</h4>
                  <p class="text-xs text-slate-400 mt-1 max-w-[180px]">Select talking points from the left to build your story</p>
                </div>

                <div v-else class="flex-1 flex flex-col">
                  <draggable 
                    v-model="selectedTalkingPoints" 
                    item-key="title"
                    class="space-y-3 flex-1 overflow-y-auto pr-2 max-h-[500px]"
                    handle=".drag-handle"
                  >
                    <template #item="{element, index}">
                      <div class="p-4 bg-white border border-indigo-100 rounded-2xl shadow-sm flex items-start gap-3 group">
                        <div class="drag-handle cursor-grab mt-1 text-stone-300 hover:text-indigo-400 transition-colors shrink-0">
                          <GripVertical :size="18" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-bold text-sm text-slate-800">{{ element.title }}</h4>
                        </div>
                        <button @click="removeSelectedTalkingPoint(index)" class="text-stone-300 hover:text-red-500 transition-colors shrink-0">
                          <Trash2 :size="16" />
                        </button>
                      </div>
                    </template>
                  </draggable>

                  <div class="mt-8 pt-8 border-t border-stone-100">
                    <button 
                      @click="generateDraft"
                      :disabled="isGeneratingDraft"
                      class="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <template v-if="isGeneratingDraft">
                        <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Writing Draft...
                      </template>
                      <template v-else>
                        <Send :size="20" />
                        Write Executive Report
                      </template>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Draft Result -->
            <div v-else-if="reportData" class="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="flex items-center justify-between mb-12 pb-6 border-b border-stone-100">
                <h3 class="text-2xl font-black text-slate-800 italic uppercase">{{ reportData.report_title }}</h3>
                <div class="flex items-center gap-3">
                  <button 
                    @click="reportData = null"
                    class="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Edit Selections
                  </button>
                  <button 
                    @click="generateTalkingPoints"
                    class="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Start Over
                  </button>
                </div>
              </div>

              <!-- Blocks Grid/Layout -->
              <div class="space-y-10 max-w-5xl mx-auto">
                <div v-for="(block, bIdx) in reportData.blocks" :key="bIdx">
                  <!-- Hero Block -->
                  <HeroBlock 
                    v-if="block.type === 'hero'" 
                    v-bind="block.data" 
                  />

                  <!-- Metric Grid -->
                  <div v-else-if="block.type === 'metric'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MetricBlock v-bind="block.data" />
                  </div>

                  <!-- Chart Block -->
                  <ChartBlock 
                    v-else-if="block.type === 'chart'" 
                    v-bind="block.data" 
                  />

                  <!-- Narrative Block (Editable) -->
                  <NarrativeBlock
                    v-else-if="block.type === 'narrative'"
                    v-bind="block.data"
                  />

                  <!-- Insight Block -->
                  <InsightBlock 
                    v-else-if="block.type === 'insight'" 
                    v-bind="block.data" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex flex-col justify-center items-center h-64 gap-4"
      >
        <div
          class="w-10 h-10 border-4 border-amplify-purple border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="text-sm font-bold text-slate-400 animate-pulse">
          Calculating rankings...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center gap-4"
      >
        <div
          class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0"
        >
          <Minus class="text-red-600" />
        </div>
        <div>
          <h3 class="font-bold">Data Load Error</h3>
          <p class="text-sm opacity-80">{{ error }}</p>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="superlatives.length === 0"
        class="text-center py-24 bg-white rounded-[2rem] border border-stone-100 shadow-sm"
      >
        <div
          class="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Award class="text-slate-300" :size="40" />
        </div>
        <h3 class="text-xl font-bold text-slate-700">
          No chart data available
        </h3>
        <p class="text-slate-400 mt-2 max-w-sm mx-auto font-medium">
          We haven't processed rankings for this period yet. Check back soon or
          select a different month.
        </p>
      </div>

      <!-- Grouped Content -->
      <div v-else class="space-y-20">
        <div
          v-for="entity in groupedSuperlatives"
          :key="entity.id"
          class="space-y-8"
        >
          <div class="flex items-center gap-4">
            <div class="h-10 w-1.5 bg-amplify-purple rounded-full"></div>
            <h2
              class="text-2xl font-black text-slate-800 tracking-tight italic uppercase"
            >
              {{ entity.name }}
            </h2>
            <div class="h-px bg-stone-200 flex-1"></div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            <div
              v-for="(highlight, hIdx) in entity.highlights"
              :key="hIdx"
              class="bg-white rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col"
            >
              <!-- Chart Header -->
              <div class="p-6 bg-stone-50/50 border-b border-stone-100">
                <h4 class="font-bold text-slate-800 text-lg leading-tight">
                  {{ formatHighlightTitle(highlight) }}
                </h4>
              </div>

              <!-- Winners List -->
              <div class="p-2 divide-y divide-stone-50">
                <div
                  v-for="winner in highlight.winners"
                  :key="winner.item_id"
                  class="p-5 flex items-start gap-4 hover:bg-stone-50/30 transition-all group relative"
                >
                  <!-- Position & Movement -->
                  <div
                    class="flex flex-col items-center justify-center w-12 pt-1"
                  >
                    <span
                      class="text-2xl font-black text-slate-800 leading-none mb-1"
                    >
                      {{ winner.position }}
                    </span>

                    <div
                      v-if="winner.rank_delta !== undefined"
                      class="flex items-center gap-0.5"
                    >
                      <template v-if="!winner.previous_position">
                        <span
                          class="text-[9px] font-black text-blue-500 uppercase tracking-tighter"
                          >NEW</span
                        >
                      </template>
                      <template v-else-if="winner.rank_delta > 0">
                        <ArrowUp
                          class="text-green-500"
                          :size="10"
                          stroke-width="3"
                        />
                        <span
                          class="text-[10px] font-bold text-green-500"
                          >{{ winner.rank_delta }}</span
                        >
                      </template>
                      <template v-else-if="winner.rank_delta < 0">
                        <ArrowDown
                          class="text-red-500"
                          :size="10"
                          stroke-width="3"
                        />
                        <span
                          class="text-[10px] font-bold text-red-500"
                          >{{ Math.abs(winner.rank_delta) }}</span
                        >
                      </template>
                      <template v-else>
                        <Minus
                          class="text-slate-300"
                          :size="10"
                          stroke-width="3"
                        />
                      </template>
                    </div>
                  </div>

                  <!-- Info & Awards -->
                  <div v-if="winner.thumbnail_url" class="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-stone-100 shadow-sm mt-1">
                    <img :src="winner.thumbnail_url" class="w-full h-full object-cover" />
                  </div>

                  <div class="flex-1 min-w-0">
                    <div
                      class="font-bold text-slate-800 text-lg leading-snug group-hover:text-amplify-purple transition-colors truncate mb-1"
                    >
                      {{ formatItemName(winner.item_name) }}
                    </div>

                    <!-- Meta Stats -->
                    <div class="flex flex-wrap items-center gap-y-1 gap-x-3">
                      <div
                        v-if="winner.peak_position"
                        class="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                      >
                        <span class="opacity-60">Peak:</span>
                        <span class="text-slate-600"
                          >#{{ winner.peak_position }}</span
                        >
                      </div>
                      <div
                        v-if="winner.periods_on_chart"
                        class="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                      >
                        <span class="opacity-60">Months:</span>
                        <span
                          class="text-slate-600"
                          >{{ winner.periods_on_chart }}</span
                        >
                      </div>

                      <!-- Award Tags -->
                      <div v-if="winner.awards?.length" class="flex items-center gap-1 mt-0.5">
                        <div 
                          v-for="award in winner.awards" 
                          :key="award.id"
                          class="group/award relative"
                        >
                          <span 
                            class="w-6 h-6 rounded-full bg-slate-50 border border-stone-100 flex items-center justify-center text-xs shadow-sm hover:scale-125 transition-transform cursor-help"
                          >
                            {{ award.emoji }}
                          </span>
                          
                          <!-- Popover Content -->
                          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white p-3 rounded-xl shadow-xl opacity-0 invisible group-hover/award:opacity-100 group-hover/award:visible transition-all z-50 pointer-events-none">
                            <div class="flex items-center gap-2 mb-1">
                              <span class="text-sm">{{ award.emoji }}</span>
                              <span class="font-bold text-xs text-indigo-300 uppercase tracking-wider">{{ award.label }}</span>
                            </div>
                            <p class="text-[10px] leading-relaxed text-slate-300">
                              {{ award.description }}
                            </p>
                            <!-- Triangle -->
                            <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Value Display -->
                  <div class="text-right pt-1 shrink-0">
                    <div
                      class="text-xl font-black text-amplify-purple font-mono tracking-tighter"
                    >
                      {{ formatValue(winner.metric_name, winner.metric_value) }}
                    </div>
                    <div
                      class="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5"
                    >
                      {{ formatMetricName(winner.metric_name) }}
                    </div>
                  </div>

                  <!-- Streak Indicator -->
                  <div
                    v-if="winner.periods_on_chart && winner.periods_on_chart >= 3"
                    class="absolute -left-1 top-1/2 -translate-y-1/2"
                  >
                    <div
                      class="bg-orange-500 text-white p-1 rounded-r-lg shadow-sm"
                    >
                      <Flame :size="12" fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
/* TipTap Editor Styles */
.ProseMirror:focus {
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

/* Floating Menu Animation */
.tippy-box[data-animation='fade'][data-state='hidden'] {
  opacity: 0;
}
</style>
