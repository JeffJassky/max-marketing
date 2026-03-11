<script setup lang="ts">
import { computed } from 'vue';

interface RingData {
  value: number;
  percent: number;
}

const props = defineProps<{
  data: {
    score: number;
    scoreMethod: 'rolling' | 'mom';
    totalImpressions: number;
    periodLabel: string;
    mom: number | null;
    yoy: number | null;
    heroComparison: { type: string; value: number } | null;
    rings: {
      earned: RingData;
      paid: RingData;
      engaged: RingData;
    };
  };
}>();

const formatNum = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

// Only show rings that actually have data
const activeRingConfig = computed(() => {
  const all = [
    { key: 'earned' as const, radius: 120, strokeWidth: 18, color: '#84CC16', glowColor: '#84CC1660', label: 'Earned\n(Organic)' },
    { key: 'paid' as const, radius: 94, strokeWidth: 16, color: '#06B6D4', glowColor: '#06B6D460', label: 'Paid\nExposure' },
    { key: 'engaged' as const, radius: 70, strokeWidth: 14, color: '#7C3AED', glowColor: '#7C3AED60', label: 'Engaged' },
  ];
  return all.filter(cfg => props.data.rings[cfg.key].value > 0);
});

// SVG ring calculations — 270-degree arc with gap at bottom-left
const rings = computed(() =>
  activeRingConfig.value.map((cfg) => {
    const circumference = 2 * Math.PI * cfg.radius;
    const arcFraction = 0.75; // 270 degrees
    const maxArc = circumference * arcFraction;
    const pct = props.data.rings[cfg.key].percent;
    const filledArc = (pct / 100) * maxArc;
    const rotation = 135;
    return {
      ...cfg,
      circumference,
      filledArc,
      maxArc,
      gap: circumference - filledArc,
      rotation,
      value: props.data.rings[cfg.key].value,
      percent: pct,
    };
  })
);

// All ring configs for background tracks (always show all 3 tracks)
const allRingConfig = [
  { key: 'earned', radius: 120, strokeWidth: 18 },
  { key: 'paid', radius: 94, strokeWidth: 16 },
  { key: 'engaged', radius: 70, strokeWidth: 14 },
];

const bgRings = computed(() =>
  allRingConfig.map((cfg) => {
    const circumference = 2 * Math.PI * cfg.radius;
    const maxArc = circumference * 0.75;
    return { ...cfg, circumference, maxArc, rotation: 135 };
  })
);

const hasComparisons = computed(() => props.data.mom !== null || props.data.yoy !== null);

const scoreLabel = computed(() => {
  if (props.data.scoreMethod === 'rolling') return 'Brand Impact Score';
  return 'Brand Impact Score';
});

const scoreSubtext = computed(() => {
  if (props.data.scoreMethod === 'rolling') return 'vs 6-month baseline';
  return 'vs prior period';
});

const svgSize = 300;
const center = svgSize / 2;
</script>

<template>
  <div class="bg-[#0B1120] p-8 pb-10 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] group/block relative lg:col-span-2 overflow-hidden">
    <!-- Radial glow behind the donut -->
    <div class="absolute top-1/2 left-[170px] -translate-y-1/2 w-[360px] h-[360px] bg-emerald-500/[0.03] rounded-full blur-[80px] pointer-events-none" />

    <!-- Header -->
    <div class="flex items-center justify-between mb-2 relative">
      <span class="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-500">Brand Pulse</span>
    </div>

    <!-- Main layout: donut left, info right -->
    <div class="flex items-center gap-10 relative">
      <!-- Concentric Ring Donut -->
      <div class="relative flex-shrink-0" :style="{ width: svgSize + 'px', height: svgSize + 'px' }">
        <svg :width="svgSize" :height="svgSize" :viewBox="`0 0 ${svgSize} ${svgSize}`">
          <defs>
            <filter v-for="ring in rings" :key="ring.key + '-filter'" :id="`glow-${ring.key}`" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur :in="'SourceGraphic'" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Background track rings (always show all 3) -->
          <circle
            v-for="ring in bgRings"
            :key="ring.key + '-bg'"
            :cx="center"
            :cy="center"
            :r="ring.radius"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            :stroke-width="ring.strokeWidth"
            :stroke-dasharray="`${ring.maxArc} ${ring.circumference - ring.maxArc}`"
            :transform="`rotate(${ring.rotation} ${center} ${center})`"
            stroke-linecap="round"
          />

          <!-- Filled arcs with glow (only rings with data) -->
          <circle
            v-for="ring in rings"
            :key="ring.key"
            :cx="center"
            :cy="center"
            :r="ring.radius"
            fill="none"
            :stroke="ring.color"
            :stroke-width="ring.strokeWidth"
            :stroke-dasharray="`${ring.filledArc} ${ring.gap}`"
            :transform="`rotate(${ring.rotation} ${center} ${center})`"
            stroke-linecap="round"
            :filter="`url(#glow-${ring.key})`"
            class="transition-all duration-700 ease-out"
          />
        </svg>

        <!-- Center text -->
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-500">Total Impressions</span>
          <span class="text-[38px] font-bold text-white leading-none mt-2 font-mono tracking-tight">{{ formatNum(data.totalImpressions) }}</span>
          <span class="text-[11px] text-gray-500 mt-1.5">{{ data.periodLabel }}</span>
        </div>
      </div>

      <!-- Score + Layer Breakdown -->
      <div class="flex-shrink-0 w-[280px]">
        <!-- Brand Impact Score -->
        <div :class="hasComparisons ? 'mb-7' : 'mb-5'">
          <div class="text-[11px] font-semibold tracking-[0.1em] uppercase text-gray-500 mb-1.5">{{ scoreLabel }}</div>
          <div class="flex items-baseline gap-1.5">
            <span class="font-mono text-[52px] font-bold text-white leading-none">{{ data.score }}</span>
            <span class="text-lg text-gray-500 font-medium">/100</span>
          </div>
          <div class="text-[10px] text-gray-600 mt-1">{{ scoreSubtext }}</div>

          <!-- MoM and YoY — only shown when data exists -->
          <div v-if="hasComparisons" class="flex items-center gap-5 mt-2.5">
            <span
              v-if="data.mom !== null"
              class="text-[13px] font-semibold flex items-center gap-1"
              :class="data.mom >= 0 ? 'text-emerald-400' : 'text-red-400'"
            >
              <span class="text-[9px]">{{ data.mom >= 0 ? '&#9650;' : '&#9660;' }}</span>
              {{ Math.abs(data.mom).toFixed(0) }}% MoM
            </span>
            <span
              v-if="data.yoy !== null"
              class="text-[13px] font-semibold flex items-center gap-1"
              :class="data.yoy >= 0 ? 'text-emerald-400' : 'text-red-400'"
            >
              <span class="text-[9px]">{{ data.yoy >= 0 ? '&#9650;' : '&#9660;' }}</span>
              {{ Math.abs(data.yoy).toFixed(0) }}% YoY
            </span>
          </div>
        </div>

        <!-- Layer breakdown — only layers with data -->
        <div class="space-y-4">
          <div
            v-for="ring in rings"
            :key="ring.key + '-legend'"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: ring.color, boxShadow: `0 0 8px ${ring.glowColor}` }"
              />
              <span class="text-[13px] font-medium text-gray-400 leading-tight whitespace-pre-line">{{ ring.label }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-[12px] text-gray-500 font-mono">{{ ring.percent }}%</span>
              <span class="text-[14px] font-bold text-gray-200 font-mono tabular-nums w-16 text-right">{{ formatNum(ring.value) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
