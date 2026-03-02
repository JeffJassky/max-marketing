<script setup lang="ts">
import { computed } from 'vue';
import { EyeOff } from 'lucide-vue-next';
import Sparkline from '../../Sparkline.vue';

const props = defineProps<{
  data: {
    totalSessions: number;
    totalSessionsChange: number;
    engagedRate: number;
    daily: number[];
    channels: { label: string; sessions: number; pct: number; change: number }[];
  };
}>();

const emit = defineEmits<{ (e: 'hide'): void }>();

const formatNum = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const topChannels = computed(() => props.data.channels.slice(0, 5));

const channelColor = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('social') || l.includes('referral')) return '#E1306C';
  if (l.includes('paid')) return '#6C63FF';
  if (l.includes('organic') && l.includes('search')) return '#06B6D4';
  if (l.includes('direct')) return '#F59E0B';
  if (l.includes('email')) return '#10B981';
  if (l.includes('display')) return '#8B5CF6';
  return '#9CA3AF';
};
</script>

<template>
  <div class="bg-white p-7 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] group/block relative">
    <div class="flex items-center justify-between mb-5">
      <span class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-500">Site Traffic</span>
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
      <div class="font-mono text-[34px] font-semibold leading-none text-slate-900">{{ formatNum(data.totalSessions) }}</div>
      <div class="text-[10px] text-gray-400 mt-1 mb-1.5">Total website sessions from GA4</div>
      <div class="flex items-center gap-1 text-[10px]">
        <span class="font-semibold" :class="data.totalSessionsChange >= 0 ? 'text-emerald-500' : 'text-red-500'">
          {{ data.totalSessionsChange >= 0 ? '&#x25B2;' : '&#x25BC;' }} {{ Math.abs(data.totalSessionsChange).toFixed(1) }}%
        </span>
        <span class="text-gray-400 ml-1">vs. prior 30 days</span>
      </div>
    </div>

    <!-- Sparkline -->
    <div v-if="data.daily.length > 1" class="h-7 my-2.5">
      <Sparkline :data="data.daily" color="#F59E0B" />
    </div>

    <!-- Divider -->
    <div class="h-px bg-gray-200 my-3" />

    <!-- Traffic Sources header with Engaged rate -->
    <div class="flex items-baseline justify-between mb-2">
      <div class="text-[11px] font-bold text-slate-900">Traffic Sources</div>
      <span class="text-[9px]">
        <span class="text-gray-400">Engaged </span>
        <span class="font-semibold text-emerald-500">{{ data.engagedRate }}%</span>
      </span>
    </div>

    <!-- Stacked bar with % labels inside -->
    <div class="h-[22px] rounded-md overflow-hidden flex mb-2">
      <div
        v-for="ch in topChannels"
        :key="ch.label"
        :style="{ width: `${ch.pct}%`, background: channelColor(ch.label) }"
        class="h-full flex items-center justify-center text-[9px] font-semibold text-white"
      >
        <span v-if="ch.pct >= 12">{{ Math.round(ch.pct) }}%</span>
      </div>
    </div>

    <!-- Channel rows -->
    <div class="space-y-0">
      <div
        v-for="ch in topChannels"
        :key="ch.label"
        class="flex items-center justify-between py-[5px] text-[10px] border-t border-gray-50 first:border-t-0"
      >
        <div class="flex items-center gap-1.5 text-gray-500 font-medium">
          <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: channelColor(ch.label) }" />
          {{ ch.label }}
        </div>
        <div class="flex items-center gap-1.5">
          <span class="font-mono font-semibold text-slate-900">{{ formatNum(ch.sessions) }}</span>
          <span
            class="text-[9px] font-semibold"
            :class="ch.change >= 0 ? 'text-emerald-500' : 'text-red-500'"
          >{{ ch.change >= 0 ? '&uarr;' : '&darr;' }} {{ Math.abs(ch.change).toFixed(0) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
