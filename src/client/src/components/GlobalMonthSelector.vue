<script setup lang="ts">
import { onMounted } from 'vue';
import { useMonthlySelection } from '../composables/useMonthlySelection';
import { Calendar, ChevronDown } from 'lucide-vue-next';

const { selectedMonth, availableMonths, loadMonths } = useMonthlySelection();

const formatMonth = (label: string) => {
  if (!label) return '';
  const [year, month] = label.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
};

onMounted(() => {
  loadMonths();
});
</script>

<template>
  <div class="relative">
    <div class="relative flex items-center">
      <div class="absolute left-3 text-indigo-400 pointer-events-none">
        <Calendar class="w-4 h-4" />
      </div>
      <select
        v-model="selectedMonth"
        class="appearance-none bg-slate-900 border border-slate-700 text-slate-200 font-bold py-2 pl-10 pr-10 rounded-xl text-sm hover:border-indigo-500 hover:bg-slate-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer min-w-[200px]"
      >
        <option
          v-for="m in availableMonths"
          :key="m.period_label"
          :value="m.period_label"
        >
          {{ formatMonth(m.period_label) }}
        </option>
      </select>
      <div class="absolute right-3 text-slate-500 pointer-events-none">
        <ChevronDown class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>
