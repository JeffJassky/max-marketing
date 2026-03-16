<script setup lang="ts">
import Sparkline from '../../Sparkline.vue';

const props = defineProps<{
  data: {
    total: number;
    totalChange: number;
    channels: { label: string; impressions: number; change: number; pct: number }[];
    daily?: number[];
  };
}>();

const formatNum = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const channelColor = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('organic') && l.includes('social')) return '#10B981';
  if (l.includes('instagram') || l.includes('facebook')) return '#10B981';
  if (l.includes('paid') || l.includes('google') || l.includes('meta')) return '#6C63FF';
  if (l.includes('search')) return '#06B6D4';
  return '#9CA3AF';
};
</script>

<template>
  <div class="bg-white p-7 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] group/block relative">
    <div class="flex items-center justify-between mb-5">
      <span class="text-xs font-bold tracking-[0.1em] uppercase text-gray-500">Reach Breakdown</span>
    </div>

    <!-- Hero -->
    <div class="mb-1">
      <div class="font-mono text-[34px] font-semibold leading-none text-slate-900">{{ formatNum(data.total) }}</div>
      <div class="text-xs text-gray-400 mt-1 mb-1.5">Total impressions across all channels</div>
      <div class="flex items-center gap-1 text-xs">
        <span class="font-semibold" :class="data.totalChange >= 0 ? 'text-emerald-500' : 'text-red-500'">
          {{ data.totalChange >= 0 ? '&#x25B2;' : '&#x25BC;' }} {{ Math.abs(data.totalChange).toFixed(1) }}%
        </span>
        <span class="text-gray-400 ml-1">vs. prior 30 days</span>
      </div>
    </div>

    <!-- Sparkline -->
    <div v-if="data.daily && data.daily.length > 1" class="h-7 my-2.5">
      <Sparkline :data="data.daily" color="#6C63FF" />
    </div>

    <!-- Divider -->
    <div class="h-px bg-gray-200 my-3" />

    <!-- Where Your Reach Comes From -->
    <div class="text-[13px] font-bold text-slate-900 mb-2">Where Your Reach Comes From</div>

    <!-- Stacked bar with % labels inside -->
    <div class="h-[22px] rounded-md overflow-hidden flex mb-2">
      <div
        v-for="ch in data.channels"
        :key="ch.label"
        :style="{ width: `${ch.pct}%`, background: channelColor(ch.label) }"
        class="h-full flex items-center justify-center text-[11px] font-semibold text-white"
      >
        <span v-if="ch.pct >= 12">{{ Math.round(ch.pct) }}%</span>
      </div>
    </div>

    <!-- Channel rows -->
    <div class="space-y-0">
      <div
        v-for="ch in data.channels"
        :key="ch.label"
        class="flex items-center justify-between py-[5px] text-xs border-t border-gray-50 first:border-t-0"
      >
        <div class="flex items-center gap-1.5 text-gray-500 font-medium">
          <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: channelColor(ch.label) }" />
          {{ ch.label }}
        </div>
        <div class="flex items-center gap-1.5">
          <span class="font-mono font-semibold text-slate-900">{{ formatNum(ch.impressions) }}</span>
          <span
            class="text-[11px] font-semibold"
            :class="ch.change >= 0 ? 'text-emerald-500' : 'text-red-500'"
          >{{ ch.change >= 0 ? '&uarr;' : '&darr;' }} {{ Math.abs(ch.change).toFixed(0) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
