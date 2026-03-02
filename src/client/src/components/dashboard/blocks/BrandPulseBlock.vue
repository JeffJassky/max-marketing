<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUpRight, ArrowDownRight, EyeOff } from 'lucide-vue-next';

const props = defineProps<{
  data: {
    score: number;
    scoreChange: number;
    rings: { earned: number; paid: number; engaged: number };
    totalImpressions: number;
    totalImpressionsChange: number;
  };
}>();

const emit = defineEmits<{ (e: 'hide'): void }>();

const formatNum = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

// Ring rotation degrees based on percentage (270 deg arc)
const ringDeg = (pct: number) => Math.min(pct, 100) * 2.7;
</script>

<template>
  <div class="bg-white p-7 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] group/block relative lg:col-span-2">
    <div class="flex items-center justify-between mb-5">
      <span class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-500">Brand Pulse</span>
      <button
        @click="emit('hide')"
        class="opacity-0 group-hover/block:opacity-100 transition-opacity text-gray-300 hover:text-gray-500"
        title="Hide block"
      >
        <EyeOff :size="16" />
      </button>
    </div>

    <div class="flex items-center justify-center flex-1 gap-4">
      <!-- Concentric Ring Donut -->
      <div class="relative w-40 h-40 flex-shrink-0">
        <!-- Outer ring (Earned — lime) -->
        <div
          class="absolute inset-0 rounded-full border-[10px] border-transparent"
          :style="{
            borderTopColor: '#84CC16',
            borderRightColor: data.rings.earned > 33 ? '#84CC16' : 'transparent',
            borderBottomColor: data.rings.earned > 66 ? '#84CC16' : 'transparent',
            transform: `rotate(-30deg)`,
          }"
        />
        <!-- Mid ring (Paid — cyan) -->
        <div
          class="absolute rounded-full border-[8px] border-transparent"
          :style="{
            width: '120px', height: '120px',
            top: '20px', left: '20px',
            borderTopColor: '#06B6D4',
            borderRightColor: data.rings.paid > 50 ? '#06B6D4' : 'transparent',
            transform: `rotate(-60deg)`,
          }"
        />
        <!-- Inner ring (Engaged — indigo) -->
        <div
          class="absolute rounded-full border-[6px] border-transparent"
          :style="{
            width: '84px', height: '84px',
            top: '38px', left: '38px',
            borderTopColor: '#6C63FF',
            transform: `rotate(-45deg)`,
          }"
        />
        <!-- Center -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div class="font-mono text-xl font-semibold text-slate-900 leading-none">{{ formatNum(data.totalImpressions) }}</div>
          <div class="text-[8px] text-gray-400 mt-0.5">Impressions</div>
        </div>
      </div>

      <!-- Score Area -->
      <div class="ml-4">
        <div class="text-[8px] font-semibold tracking-[0.08em] uppercase text-gray-400 mb-0.5">Brand Impact Score</div>
        <div class="font-mono text-[28px] font-semibold text-slate-900 leading-none">
          {{ data.score }}<span class="text-xs text-gray-400">/100</span>
        </div>
        <div
          class="mt-1.5 text-[9px] font-semibold flex items-center gap-1"
          :class="data.totalImpressionsChange >= 0 ? 'text-emerald-500' : 'text-red-500'"
        >
          <span>{{ data.totalImpressionsChange >= 0 ? '&#x25B2;' : '&#x25BC;' }} {{ Math.abs(data.totalImpressionsChange).toFixed(0) }}% MoM</span>
        </div>
      </div>
    </div>
  </div>
</template>
