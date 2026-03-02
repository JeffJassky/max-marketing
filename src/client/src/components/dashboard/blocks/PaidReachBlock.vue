<script setup lang="ts">
import { computed } from 'vue';
import { EyeOff } from 'lucide-vue-next';
import Sparkline from '../../Sparkline.vue';

const props = defineProps<{
  data: {
    totalImpressions: number;
    totalReach: number;
    totalSpend: number;
    platforms: { platform: string; impressions: number; cpm: number; isBest: boolean }[];
    paidVsOrganicPct: number;
    daily?: number[];
  };
}>();

const emit = defineEmits<{ (e: 'hide'): void }>();

const formatNum = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const formatCurrency = (n: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
};

const platformLabel = (p: string) => {
  if (p === 'google') return 'Google Ads';
  if (p === 'facebook') return 'Meta Ads';
  return p;
};

const platformDotColor = (p: string) => {
  if (p === 'google') return '#4285F4';
  if (p === 'facebook') return '#0081FB';
  return '#9CA3AF';
};

// Sort platforms by CPM (best first)
const sortedPlatforms = computed(() =>
  [...props.data.platforms].sort((a, b) => {
    if (a.cpm === 0) return 1;
    if (b.cpm === 0) return -1;
    return a.cpm - b.cpm;
  })
);

const organicPct = computed(() => 100 - props.data.paidVsOrganicPct);
</script>

<template>
  <div class="bg-white p-7 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] group/block relative">
    <div class="flex items-center justify-between mb-5">
      <span class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-500">Paid Reach</span>
      <button
        @click="emit('hide')"
        class="opacity-0 group-hover/block:opacity-100 transition-opacity text-gray-300 hover:text-gray-500"
        title="Hide block"
      >
        <EyeOff :size="16" />
      </button>
    </div>

    <!-- Hero -->
    <div class="mb-1">
      <div class="font-mono text-[34px] font-semibold leading-none text-slate-900">{{ formatNum(data.totalImpressions) }}</div>
      <div class="text-[10px] text-gray-400 mt-1 mb-1.5">Total paid impressions across all ad platforms</div>
      <div class="text-[10px] text-gray-500 mb-1.5">
        Reach: <strong class="font-mono text-slate-900">{{ formatNum(data.totalReach) }}</strong>
        <span class="text-gray-300 mx-1">&middot;</span>
        Spend: <strong class="font-mono text-slate-900">{{ formatCurrency(data.totalSpend) }}</strong>
      </div>
    </div>

    <!-- Sparkline -->
    <div v-if="data.daily && data.daily.length > 1" class="h-7 my-2.5">
      <Sparkline :data="data.daily" color="#6C63FF" />
    </div>

    <!-- Divider -->
    <div class="h-px bg-gray-200 my-3" />

    <!-- Cost Per 1,000 Impressions -->
    <div class="text-[11px] font-bold text-slate-900 mb-2">Cost Per 1,000 Impressions</div>

    <div class="space-y-0">
      <div
        v-for="p in sortedPlatforms"
        :key="p.platform"
        class="flex items-center justify-between py-[5px] text-[10px] border-t border-gray-50 first:border-t-0"
      >
        <div class="flex items-center gap-1.5 text-gray-500 font-medium">
          <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: platformDotColor(p.platform) }" />
          {{ platformLabel(p.platform) }}
        </div>
        <div class="flex items-center gap-1.5">
          <span class="font-mono font-semibold text-slate-900">{{ formatCurrency(p.cpm) }}</span>
          <span
            v-if="p.isBest"
            class="text-[8px] font-bold text-emerald-500 bg-emerald-500/[0.06] px-1 py-px rounded"
          >Best</span>
        </div>
      </div>
    </div>

    <!-- Paid vs. Organic -->
    <div class="mt-2.5 bg-gray-50 rounded-md p-2.5">
      <div class="flex justify-between mb-1.5">
        <span class="text-[10px] font-semibold text-gray-500">Paid vs. Organic Impressions</span>
        <span class="text-[10px] font-semibold text-slate-900">{{ data.paidVsOrganicPct }}% / {{ organicPct }}%</span>
      </div>
      <div class="h-2 rounded-full overflow-hidden flex">
        <div :style="{ width: `${data.paidVsOrganicPct}%` }" class="h-full bg-indigo-500" />
        <div :style="{ width: `${organicPct}%` }" class="h-full bg-emerald-500" />
      </div>
    </div>
  </div>
</template>
