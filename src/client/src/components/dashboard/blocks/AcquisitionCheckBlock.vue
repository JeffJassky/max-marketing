<script setup lang="ts">
const props = defineProps<{
  data: {
    trueCac: number;
    trueCacChange: number;
    platformRows: { platform: string; cpa: number; spend: number }[];
    newCustomers: number;
    overclaimPct: number;
  };
}>();

const formatCurrency = (n: number, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
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
</script>

<template>
  <div class="bg-white p-7 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] group/block relative">
    <div class="flex items-center justify-between mb-5">
      <span class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-500">Acquisition Reality Check</span>
    </div>

    <!-- Hero -->
    <div class="mb-1">
      <div class="font-mono text-[34px] font-semibold leading-none text-slate-900">{{ formatCurrency(data.trueCac) }}</div>
      <div class="text-[10px] text-gray-400 mt-1 mb-1.5">True cost per customer &middot; Shopify verified</div>
      <div class="flex items-center gap-1 text-[10px]">
        <span class="font-semibold" :class="data.trueCacChange <= 0 ? 'text-emerald-500' : 'text-red-500'">
          {{ data.trueCacChange > 0 ? '&#x25B2;' : '&#x25BC;' }} {{ Math.abs(data.trueCacChange).toFixed(1) }}%
        </span>
        <span class="text-gray-400 ml-1">vs. prior 30 days</span>
      </div>
    </div>

    <!-- Divider -->
    <div class="h-px bg-gray-200 my-3" />

    <!-- What Platforms Report -->
    <div class="text-[9px] font-semibold tracking-[0.08em] uppercase text-gray-400 mb-2">What Platforms Report</div>

    <div class="space-y-0">
      <div
        v-for="p in data.platformRows"
        :key="p.platform"
        class="flex items-center justify-between py-[5px] text-[10px] border-t border-gray-50 first:border-t-0"
      >
        <div class="flex items-center gap-1.5 text-gray-500 font-medium">
          <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: platformDotColor(p.platform) }" />
          {{ platformLabel(p.platform) }} says
        </div>
        <span class="font-mono text-[10px] font-semibold text-slate-900">{{ formatCurrency(p.cpa) }}</span>
      </div>
    </div>

    <!-- Shopify Reality callout -->
    <div class="mt-2 flex items-center justify-between px-2.5 py-1.5 rounded-md bg-indigo-500/[0.03] border border-indigo-500/[0.09] text-[9px] font-semibold text-indigo-500">
      <span>Shopify Reality</span>
      <span class="font-mono">{{ formatCurrency(data.trueCac) }}</span>
    </div>

    <!-- Over-claim bar -->
    <div v-if="data.overclaimPct > 0" class="mt-2 flex items-center gap-2">
      <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-amber-500 rounded-full"
          :style="{ width: `${Math.min(data.overclaimPct, 100)}%` }"
        />
      </div>
      <span class="text-[9px] font-semibold text-amber-500 whitespace-nowrap">Over-claim {{ Math.abs(data.overclaimPct).toFixed(0) }}%</span>
    </div>
  </div>
</template>
