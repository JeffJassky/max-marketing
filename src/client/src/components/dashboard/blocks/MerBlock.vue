<script setup lang="ts">
import { ArrowUpRight, ArrowDownRight } from 'lucide-vue-next';
import Sparkline from '../../Sparkline.vue';

const props = defineProps<{
  data: {
    value: number;
    change: number;
    daily: number[];
    totalRevenue: number;
    totalSpend: number;
  };
}>();

const formatCurrency = (n: number, decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(n);
};

const spendPct = () => {
  return props.data.totalRevenue > 0
    ? Math.round((props.data.totalSpend / props.data.totalRevenue) * 100)
    : 0;
};

const attributionPct = () => {
  // Simplified: what % of revenue is traceable to marketing
  return props.data.totalSpend > 0 && props.data.totalRevenue > 0
    ? Math.min(100, Math.round((props.data.totalSpend / props.data.totalRevenue) * props.data.value * 100 / 2))
    : 0;
};
</script>

<template>
  <div class="bg-white p-7 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] group/block relative">
    <div class="flex items-center justify-between mb-5">
      <span class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-500">Marketing Efficiency Ratio</span>
    </div>

    <!-- Hero -->
    <div class="mb-1">
      <div class="flex items-baseline gap-2.5">
        <span class="font-mono text-[34px] font-semibold leading-none text-slate-900">{{ data.value.toFixed(1) }}x</span>
        <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/[0.07] text-indigo-500">Efficiency Ratio</span>
      </div>
      <div class="text-[10px] text-gray-400 mt-1 mb-1.5">Shopify revenue &divide; total ad spend across all platforms</div>
      <div class="flex items-center gap-1 text-[10px]">
        <span class="font-semibold" :class="data.change >= 0 ? 'text-emerald-500' : 'text-red-500'">
          {{ data.change >= 0 ? '&#x25B2;' : '&#x25BC;' }} {{ Math.abs(data.change).toFixed(1) }}%
        </span>
        <span class="text-gray-400 ml-1">vs. prior 30 days</span>
      </div>
    </div>

    <!-- Sparkline -->
    <div v-if="data.daily.length > 1" class="h-10 my-2.5">
      <Sparkline :data="data.daily" color="#6C63FF" />
    </div>

    <!-- Divider -->
    <div class="h-px bg-gray-200 my-3" />

    <!-- Revenue vs. Ad Spend -->
    <div class="text-[11px] font-bold text-slate-900 mb-2">Revenue vs. Ad Spend</div>

    <!-- Combined Bar -->
    <div class="h-[22px] rounded-md overflow-hidden relative mb-2">
      <div class="absolute inset-0 bg-emerald-500/[0.15] rounded-md" />
      <div
        class="absolute left-0 top-0 h-full bg-indigo-500 rounded-l-md"
        :style="{ width: `${spendPct()}%` }"
      />
    </div>
    <div class="flex justify-between text-[10px]">
      <span>
        <span class="font-semibold text-indigo-500">{{ formatCurrency(data.totalSpend) }}</span>
        <span class="text-gray-400 ml-1">spend</span>
      </span>
      <span>
        <span class="font-semibold text-emerald-500">{{ formatCurrency(data.totalRevenue) }}</span>
        <span class="text-gray-400 ml-1">revenue</span>
      </span>
    </div>
  </div>
</template>
