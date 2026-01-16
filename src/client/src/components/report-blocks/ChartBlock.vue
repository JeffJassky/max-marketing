<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  type: 'bar' | 'area' | 'line';
  series: { name: string; data: number[] }[];
  categories: string[];
}>();

const chartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    zoom: { enabled: false }
  },
  colors: ['#6366f1', '#c3fd34', '#7c3aed'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  grid: {
    borderColor: '#f1f5f9',
    strokeDashArray: 4
  },
  xaxis: {
    categories: props.categories,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#94a3b8', fontWeight: 600 } }
  },
  yaxis: {
    labels: { style: { colors: '#94a3b8', fontWeight: 600 } }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    fontWeight: 700,
    itemMargin: { horizontal: 10 }
  }
}));
</script>

<template>
  <div class="rounded-[2.5rem] bg-white p-10 border border-slate-100 shadow-sm">
    <h3 class="mb-8 text-xl font-bold text-slate-800 tracking-tight">{{ title }}</h3>
    <apexchart
      :height="350"
      :type="type"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>
