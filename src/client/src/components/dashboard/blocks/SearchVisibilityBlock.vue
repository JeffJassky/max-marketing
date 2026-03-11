<script setup lang="ts">
import { computed } from 'vue';
import Sparkline from '../../Sparkline.vue';

const props = defineProps<{
  data: {
    totalImpressions: number;
    totalImpressionsChange: number;
    daily: number[];
    branded: { impressions: number; clicks: number; ctr: number };
    nonBranded: { impressions: number; clicks: number; ctr: number };
  };
}>();

const formatNum = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const brandedPct = computed(() => {
  return props.data.totalImpressions > 0
    ? Math.round((props.data.branded.impressions / props.data.totalImpressions) * 100)
    : 0;
});

const nonBrandedPct = computed(() => 100 - brandedPct.value);

const totalClicks = computed(() => props.data.branded.clicks + props.data.nonBranded.clicks);
const totalCtr = computed(() => {
  return props.data.totalImpressions > 0
    ? (totalClicks.value / props.data.totalImpressions) * 100
    : 0;
});

const clicksPct = computed(() => {
  return props.data.totalImpressions > 0
    ? Math.max(2, (totalClicks.value / props.data.totalImpressions) * 100)
    : 0;
});

const growthLabel = computed(() =>
  props.data.totalImpressionsChange >= 0 ? '&uarr; Growing' : '&darr; Declining'
);
</script>

<template>
  <div class="bg-white p-7 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] group/block relative">
    <div class="flex items-center justify-between mb-5">
      <span class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-500">Search Visibility</span>
    </div>

    <!-- Hero -->
    <div class="mb-1">
      <div class="flex items-baseline gap-2.5">
        <span class="font-mono text-[34px] font-semibold leading-none text-slate-900">{{ formatNum(data.totalImpressions) }}</span>
        <span
          class="text-[9px] font-semibold px-1.5 py-0.5 rounded"
          :class="data.totalImpressionsChange >= 0 ? 'text-emerald-500 bg-emerald-500/[0.06]' : 'text-red-500 bg-red-500/[0.06]'"
          v-html="growthLabel"
        />
      </div>
      <div class="text-[10px] text-gray-400 mt-1 mb-1.5">Total times your site appeared in Google search results</div>
      <div class="flex items-center gap-1 text-[10px]">
        <span class="font-semibold" :class="data.totalImpressionsChange >= 0 ? 'text-emerald-500' : 'text-red-500'">
          {{ data.totalImpressionsChange >= 0 ? '&#x25B2;' : '&#x25BC;' }} {{ Math.abs(data.totalImpressionsChange).toFixed(1) }}%
        </span>
        <span class="text-gray-400 ml-1">vs. prior 30 days</span>
      </div>
    </div>

    <!-- Sparkline -->
    <div v-if="data.daily.length > 1" class="h-7 my-2.5">
      <Sparkline :data="data.daily" color="#06B6D4" />
    </div>

    <!-- Divider -->
    <div class="h-px bg-gray-200 my-3" />

    <!-- Branded vs. Non-Branded Searches -->
    <div class="text-[11px] font-bold text-slate-900 mb-2">Branded vs. Non-Branded Searches</div>

    <div class="h-[22px] rounded-md overflow-hidden flex mb-1.5">
      <div
        :style="{ width: `${brandedPct}%` }"
        class="h-full bg-indigo-500 flex items-center justify-center text-[9px] font-semibold text-white"
      >{{ brandedPct }}%</div>
      <div
        :style="{ width: `${nonBrandedPct}%` }"
        class="h-full bg-violet-300 flex items-center justify-center text-[9px] font-semibold text-slate-900"
      >{{ nonBrandedPct }}%</div>
    </div>
    <div class="flex justify-between text-[9px] mb-3">
      <span><span class="text-gray-400">Branded </span><span class="font-mono font-semibold text-slate-900">{{ formatNum(data.branded.impressions) }}</span></span>
      <span><span class="text-gray-400">Non-Branded </span><span class="font-mono font-semibold text-slate-900">{{ formatNum(data.nonBranded.impressions) }}</span></span>
    </div>

    <!-- Impressions to Clicks -->
    <div class="mt-1">
      <div class="flex justify-between items-baseline mb-1">
        <span class="text-[11px] font-bold text-slate-900">Impressions to Clicks</span>
        <span class="text-[9px]">
          <span class="text-gray-400">CTR </span>
          <span class="font-semibold text-slate-900">{{ totalCtr.toFixed(1) }}%</span>
        </span>
      </div>
      <div class="h-[22px] rounded-md overflow-hidden bg-cyan-100 relative mb-1.5">
        <div
          class="h-full bg-cyan-500 rounded-md min-w-[24px]"
          :style="{ width: `${clicksPct}%` }"
        />
      </div>
      <div class="flex justify-between text-[9px]">
        <span><span class="text-gray-400">Clicked Through </span><span class="font-mono font-semibold text-slate-900">{{ formatNum(totalClicks) }}</span></span>
        <span><span class="text-gray-400">Total Impressions </span><span class="font-mono font-semibold text-slate-900">{{ formatNum(data.totalImpressions) }}</span></span>
      </div>
    </div>
  </div>
</template>
