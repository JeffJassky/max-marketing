<script setup lang="ts">
import { ref, onMounted, inject, type Ref, watch } from 'vue';
import {
  Sparkles,
  FileText,
  GripVertical,
  Trash2,
  CheckCircle2,
  Send,
  ChevronDown,
  BarChart3,
  Globe,
  ShoppingBag,
  Instagram,
  Facebook
} from 'lucide-vue-next';
import draggable from 'vuedraggable';
import { useMonthlySelection } from '../composables/useMonthlySelection';

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

interface TalkingPoint {
  title: string;
  victory: string;
  proof: string;
  impact: string;
  insights: string;
  referenced_superlative_index?: number;
}

const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');
const { selectedMonth, loadMonths } = useMonthlySelection();

const loading = ref(false);
const error = ref<string | null>(null);

// Data State
const superlatives = ref<any[]>([]);
const reportData = ref<{ report_title: string; blocks: any[] } | null>(null);

// Generation State
const talkingPoints = ref<TalkingPoint[]>([]);
const selectedTalkingPoints = ref<TalkingPoint[]>([]);
const isGeneratingTalkingPoints = ref(false);
const isGeneratingDraft = ref(false);

const generateTalkingPoints = async () => {
  if (!selectedAccount?.value || !selectedMonth.value) return;
  
  isGeneratingTalkingPoints.value = true;
  talkingPoints.value = [];
  selectedTalkingPoints.value = [];
  reportData.value = null;
  
  try {
    const acc = selectedAccount.value;
    const accountIds = Array.from(new Set([
      acc.id,
      acc.googleAdsId,
      acc.facebookAdsId,
      acc.ga4Id,
      acc.shopifyId,
      acc.instagramId,
      acc.facebookPageId
    ].filter(Boolean) as string[]));

    const res = await fetch('/api/reports/generate-talking-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        accountIds,
        month: selectedMonth.value
      })
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

const formatMonth = (label: string) => {
  if (!label) return '';
  const [year, month] = label.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
};

onMounted(() => {
  loadMonths();
});

// If the month changes globally, clear current draft/talking points to stay in sync?
// Or just let the user click "Analyze" again. For now, we'll keep it simple.
watch(selectedMonth, () => {
  talkingPoints.value = [];
  selectedTalkingPoints.value = [];
  reportData.value = null;
});
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
    <div class="bg-white border-b border-slate-200 pt-6 px-8 pb-6 sticky top-0 z-10 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles class="text-indigo-600" :size="28" />
            AI Report Builder
          </h1>
          <p class="text-slate-500 text-sm mt-1">Transform data into executive summaries.</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-8">
      <div class="max-w-6xl mx-auto space-y-8">
        
        <!-- Action Row -->
        <div v-if="!talkingPoints.length && !isGeneratingTalkingPoints && !reportData" class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-indigo-100 shadow-sm text-center">
          <div class="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <Sparkles class="text-indigo-600" :size="40" />
          </div>
          <h2 class="text-2xl font-bold text-slate-800 mb-2">Ready to analyze performance?</h2>
          <p class="text-slate-500 mb-8 max-w-md">
            {{ selectedMonth ? `We'll scan all chart data and platform metrics for ${formatMonth(selectedMonth)} to find your biggest wins.` : 'Please select a month to begin analysis.' }}
          </p>
          <button 
            @click="generateTalkingPoints"
            :disabled="!selectedAccount || !selectedMonth"
            class="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles :size="24" />
            Analyze Performance
          </button>
        </div>

        <!-- Analysis State -->
        <div v-if="isGeneratingTalkingPoints" class="p-20 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-slate-100">
          <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="font-bold text-slate-400 animate-pulse">Gemini is gathering data and building your story...</p>
        </div>

        <!-- Builder Interface -->
        <div v-else-if="talkingPoints.length > 0 && !reportData" class="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
           <!-- Concepts Pool -->
           <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div class="p-4 border-b border-slate-100 bg-slate-50">
                <h3 class="font-bold text-slate-700 uppercase text-xs tracking-wider">Analysis Results</h3>
              </div>
              <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                 <div 
                    v-for="(tp, idx) in talkingPoints" 
                    :key="idx"
                    @click="toggleTalkingPoint(tp)"
                    class="p-4 rounded-xl border-2 cursor-pointer transition-all group relative"
                    :class="selectedTalkingPoints.includes(tp) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'"
                  >
                    <div class="flex items-start gap-3">
                      <div class="mt-1">
                        <CheckCircle2 v-if="selectedTalkingPoints.includes(tp)" :size="20" class="text-indigo-600" />
                        <div v-else class="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-slate-400"></div>
                      </div>
                      <div>
                        <h4 class="font-bold text-slate-800 text-sm">{{ tp.title }}</h4>
                        <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ tp.victory }}</p>
                      </div>
                    </div>
                  </div>
              </div>
           </div>

           <!-- Selection -->
           <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div class="p-4 border-b border-slate-100 bg-slate-50">
                <h3 class="font-bold text-slate-700 uppercase text-xs tracking-wider">Report Structure <span class="ml-2 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[10px]">{{ selectedTalkingPoints.length }}</span></h3>
              </div>
              
              <div v-if="selectedTalkingPoints.length === 0" class="flex-1 flex flex-col items-center justify-center p-8 text-center">
                 <FileText class="text-slate-300 mb-4" :size="32" />
                 <p class="text-slate-400 text-sm">Select points from the left to build your story.</p>
              </div>

              <div v-else class="flex-1 flex flex-col p-4">
                 <draggable 
                    v-model="selectedTalkingPoints" 
                    item-key="title"
                    class="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar"
                    handle=".drag-handle"
                  >
                    <template #item="{element, index}">
                      <div class="p-3 bg-white border border-indigo-100 rounded-xl shadow-sm flex items-center gap-3">
                        <div class="drag-handle cursor-grab text-slate-300 hover:text-slate-500">
                          <GripVertical :size="16" />
                        </div>
                        <span class="text-sm font-bold text-slate-700 flex-1">{{ element.title }}</span>
                        <button @click="removeSelectedTalkingPoint(index)" class="text-slate-300 hover:text-red-500">
                          <Trash2 :size="16" />
                        </button>
                      </div>
                    </template>
                  </draggable>
                  <div class="pt-4 border-t border-slate-100 mt-4">
                    <button 
                      @click="generateDraft"
                      :disabled="isGeneratingDraft"
                      class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <template v-if="isGeneratingDraft">
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Writing Draft...
                      </template>
                      <template v-else>
                        <Send :size="18" />
                        Generate Report
                      </template>
                    </button>
                  </div>
              </div>
           </div>
        </div>

        <!-- Draft Result -->
        <div v-else-if="reportData" class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div class="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
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
            <div class="space-y-10 max-w-4xl mx-auto">
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
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
</style>