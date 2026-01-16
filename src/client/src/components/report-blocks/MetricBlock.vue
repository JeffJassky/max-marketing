<script setup lang="ts">
import { ArrowUpRight, ArrowDownRight } from 'lucide-vue-next';

defineProps<{
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  description: string;
}>();
</script>

<template>
  <div class="rounded-[2.5rem] bg-white p-10 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div class="mb-4 flex items-center justify-between">
      <span class="text-xs font-black uppercase tracking-widest text-slate-400">{{ label }}</span>
      <div v-if="change" 
        :class="trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'"
        class="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
      >
        <component :is="trend === 'up' ? ArrowUpRight : ArrowDownRight" :size="14" />
        {{ change }}
      </div>
    </div>
    
    <div class="mb-4 text-5xl font-black text-slate-900 tracking-tighter italic">
      {{ value }}
    </div>
    
    <p class="text-sm text-slate-500 font-medium leading-relaxed">
      {{ description }}
    </p>
  </div>
</template>
