<script setup lang="ts">
import { computed } from 'vue';
import { EyeOff } from 'lucide-vue-next';
import Sparkline from '../../Sparkline.vue';

const props = defineProps<{
  data: {
    momentum: number;
    trend: string;
    daily: { date: string; revenue: number; orders: number; aov: number }[];
    totalRevenue14d: number;
    avgOrders: number;
    avgAov: number;
  };
}>();

const emit = defineEmits<{ (e: 'hide'): void }>();

const formatCurrency = (n: number, decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(n);
};

const revenueDaily = computed(() => props.data.daily.map(d => d.revenue));

const totalOrders = computed(() => props.data.daily.reduce((s, d) => s + d.orders, 0));
const firstHalfOrders = computed(() => props.data.daily.slice(0, 7).reduce((s, d) => s + d.orders, 0));
const secondHalfOrders = computed(() => props.data.daily.slice(7).reduce((s, d) => s + d.orders, 0));

const momentumLabel = computed(() => {
  const m = props.data.momentum;
  if (m > 5) return 'Accelerating';
  if (m < -5) return 'Decelerating';
  return 'Flat';
});

const momentumBadgeClass = computed(() => {
  const m = props.data.momentum;
  if (m > 5) return 'text-emerald-500 bg-emerald-500/[0.06]';
  if (m < -5) return 'text-red-500 bg-red-500/[0.06]';
  return 'text-gray-500 bg-gray-500/[0.06]';
});
</script>

<template>
  <div class="bg-white p-7 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] group/block relative">
    <div class="flex items-center justify-between mb-5">
      <span class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-500">Sales Pulse</span>
      <button
        @click="emit('hide')"
        class="opacity-0 group-hover/block:opacity-100 transition-opacity text-gray-300 hover:text-gray-500"
        title="Hide block"
      >
        <EyeOff :size="16" />
      </button>
    </div>

    <!-- Hero: Momentum % -->
    <div class="mb-1">
      <div class="flex items-baseline gap-2.5">
        <span
          class="font-mono text-[34px] font-semibold leading-none"
          :class="data.momentum >= 0 ? 'text-emerald-500' : 'text-red-500'"
        >{{ data.momentum >= 0 ? '&uarr;' : '&darr;' }} {{ Math.abs(data.momentum).toFixed(0) }}%</span>
        <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded" :class="momentumBadgeClass">{{ momentumLabel }}</span>
      </div>
      <div class="text-[10px] text-gray-400 mt-1">
        <strong class="text-gray-500">{{ secondHalfOrders }} orders</strong> last 14 days vs. <strong class="text-gray-500">{{ firstHalfOrders }}</strong> prior
      </div>
    </div>

    <!-- Sparkline with midpoint -->
    <div v-if="revenueDaily.length > 1" class="h-12 my-2.5 relative">
      <!-- Midpoint dashed line -->
      <div class="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-gray-300/40" />
      <Sparkline :data="revenueDaily" color="#10B981" />
    </div>

    <!-- Period labels -->
    <div v-if="revenueDaily.length > 1" class="flex justify-between text-[9px] text-gray-400 mb-1">
      <span>Prior 14 days</span>
      <span>Last 14 days</span>
    </div>

    <!-- Divider -->
    <div class="h-px bg-gray-200 my-3" />

    <!-- What's Driving It -->
    <div class="text-[11px] font-bold text-slate-900 mb-2">What's Driving It</div>

    <div class="space-y-0">
      <div class="flex items-center justify-between py-[5px] text-[10px]">
        <span class="text-gray-500 font-medium">Orders</span>
        <div class="flex items-center gap-1.5">
          <span class="font-mono font-semibold text-slate-900">{{ totalOrders }}</span>
          <span
            class="text-[9px] font-semibold"
            :class="data.momentum >= 0 ? 'text-emerald-500' : 'text-red-500'"
          >&uarr; {{ Math.abs(data.momentum).toFixed(0) }}%</span>
        </div>
      </div>
      <div class="flex items-center justify-between py-[5px] text-[10px] border-t border-gray-50">
        <span class="text-gray-500 font-medium">Avg. Order Value</span>
        <div class="flex items-center gap-1.5">
          <span class="font-mono font-semibold text-slate-900">{{ formatCurrency(data.avgAov, 2) }}</span>
        </div>
      </div>
    </div>

    <!-- 14-Day Revenue callout -->
    <div class="mt-2 flex items-center justify-between px-2.5 py-1.5 rounded-md bg-gray-50 text-[10px]">
      <span class="font-semibold text-gray-500">14-Day Revenue</span>
      <span class="font-mono text-[11px] font-semibold text-slate-900">{{ formatCurrency(data.totalRevenue14d) }}</span>
    </div>
  </div>
</template>
