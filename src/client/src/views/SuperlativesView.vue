<script setup lang="ts">
import { ref, onMounted, watch, inject, computed, type Ref } from 'vue';
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
  ChevronDown
} from 'lucide-vue-next';
import { AllAwards } from '../../../shared/data/awards/library';

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
  ga4Id: string | null;
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
  awards?: string[];
}

const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');
const loading = ref(false);
const superlatives = ref<Superlative[]>([]);
const availableMonths = ref<{ period_label: string; period_start: string }[]>([]);
const selectedMonth = ref<string>('');
const error = ref<string | null>(null);

const getAwardInfo = (awardId: string) => {
  return AllAwards.find(a => a.id === awardId);
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

  const { id, googleAdsId, facebookAdsId, ga4Id } = selectedAccount.value;
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    if (id) params.append('accountId', id);
    if (googleAdsId) params.append('googleAdsId', googleAdsId);
    if (facebookAdsId) params.append('facebookAdsId', facebookAdsId);
    if (ga4Id) params.append('ga4Id', ga4Id);
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

const getAwardIcon = (awardId: string) => {
  return getAwardInfo(awardId)?.icon || '⭐️';
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

        <!-- Month Selector -->
        <div class="relative group">
          <label
            class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1"
            >Chart Period</label
          >
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

                                                v-for="awardId in winner.awards" 

                                                :key="awardId"

                                                class="group/award relative"

                                              >

                                                <span 

                                                  class="w-6 h-6 rounded-full bg-slate-50 border border-stone-100 flex items-center justify-center text-xs shadow-sm hover:scale-125 transition-transform cursor-help"

                                                >

                                                  {{ getAwardIcon(awardId) }}

                                                </span>

                                                

                                                <!-- Popover Content -->

                                                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white p-3 rounded-xl shadow-xl opacity-0 invisible group-hover/award:opacity-100 group-hover/award:visible transition-all z-50 pointer-events-none">

                                                  <div class="flex items-center gap-2 mb-1">

                                                    <span class="text-sm">{{ getAwardIcon(awardId) }}</span>

                                                    <span class="font-bold text-xs text-indigo-300 uppercase tracking-wider">{{ getAwardInfo(awardId)?.label || awardId }}</span>

                                                  </div>

                                                  <p class="text-[10px] leading-relaxed text-slate-300">

                                                    {{ getAwardInfo(awardId)?.description || 'No description available for this award.' }}

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
