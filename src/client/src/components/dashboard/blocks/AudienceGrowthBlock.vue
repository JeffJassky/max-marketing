<script setup lang="ts">
import { computed } from 'vue';
import { EyeOff } from 'lucide-vue-next';
import Sparkline from '../../Sparkline.vue';

const props = defineProps<{
  data: {
    totalFollowers: number;
    platforms: { platform: string; followers: number; periodAdds: number; growthRate: number }[];
    fastestGrowing: string | null;
  };
}>();

const emit = defineEmits<{ (e: 'hide'): void }>();

const formatNum = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const platformLabel = (p: string) => {
  if (p === 'instagram') return 'Instagram';
  if (p === 'facebook') return 'Facebook';
  return p;
};

const platformDotColor = (p: string) => {
  if (p === 'instagram') return '#E1306C';
  if (p === 'facebook') return '#1877F2';
  return '#9CA3AF';
};

const totalGrowthRate = computed(() => {
  const totalAdds = props.data.platforms.reduce((s, p) => s + p.periodAdds, 0);
  return props.data.totalFollowers > 0
    ? (totalAdds / props.data.totalFollowers) * 100
    : 0;
});

const fastestPlatform = computed(() => {
  if (!props.data.fastestGrowing) return null;
  return props.data.platforms.find(p => p.platform === props.data.fastestGrowing);
});

// Generate a simple upward trend line from follower data for sparkline
const sparklineData = computed(() => {
  return props.data.platforms.map(p => p.followers);
});
</script>

<template>
  <div class="bg-white p-7 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] group/block relative">
    <div class="flex items-center justify-between mb-5">
      <span class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-500">Audience Growth</span>
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
      <div class="font-mono text-[34px] font-semibold leading-none text-slate-900">{{ formatNum(data.totalFollowers) }}</div>
      <div class="text-[10px] text-gray-400 mt-1 mb-1.5">Total followers across {{ data.platforms.length }} platforms</div>
      <div class="flex items-center gap-1 text-[10px]">
        <span class="font-semibold" :class="totalGrowthRate >= 0 ? 'text-emerald-500' : 'text-red-500'">
          {{ totalGrowthRate >= 0 ? '&#x25B2;' : '&#x25BC;' }} {{ totalGrowthRate.toFixed(1) }}%
        </span>
        <span class="text-gray-400 ml-1">vs. prior 30 days</span>
      </div>
    </div>

    <!-- Divider -->
    <div class="h-px bg-gray-200 my-3" />

    <!-- By Platform -->
    <div class="text-[11px] font-bold text-slate-900 mb-2">By Platform</div>

    <div class="space-y-0">
      <div
        v-for="p in data.platforms"
        :key="p.platform"
        class="flex items-center justify-between py-[5px] text-[10px] border-t border-gray-50 first:border-t-0"
      >
        <div class="flex items-center gap-1.5 text-gray-500 font-medium">
          <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: platformDotColor(p.platform) }" />
          {{ platformLabel(p.platform) }}
        </div>
        <div class="flex items-center gap-1.5">
          <span class="font-mono font-semibold text-slate-900">{{ formatNum(p.followers) }}</span>
          <span
            class="text-[9px] font-semibold"
            :class="p.growthRate >= 0 ? 'text-emerald-500' : 'text-red-500'"
          >{{ p.growthRate >= 0 ? '&uarr;' : '&darr;' }} {{ Math.abs(p.growthRate).toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <!-- Fastest callout -->
    <div
      v-if="fastestPlatform"
      class="mt-2 flex items-center justify-between px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-100/40 text-[9px]"
    >
      <span class="text-gray-500">&#x26A1; <span class="text-emerald-500 font-semibold">Fastest: {{ platformLabel(fastestPlatform.platform) }}</span></span>
      <span class="font-mono text-[10px] font-semibold text-emerald-500">&uarr; {{ fastestPlatform.growthRate.toFixed(1) }}%</span>
    </div>
  </div>
</template>
