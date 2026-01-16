<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}>();

const width = props.width || 100;
const height = props.height || 30;
const color = props.color || '#6366f1'; // indigo-500

const points = computed(() => {
  const data = props.data;
  if (!data || data.length < 2) return '';

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // X step
  const stepX = width / (data.length - 1);

  return data.map((val, index) => {
    const x = index * stepX;
    // Invert Y (SVG 0 is top)
    const normalizedY = (val - min) / range;
    const y = height - (normalizedY * height);
    return `${x},${y}`;
  }).join(' ');
});

const fillPath = computed(() => {
  if (!points.value) return '';
  return `${points.value} ${width},${height} 0,${height}`;
});
</script>

<template>
  <svg :width="width" :height="height" class="overflow-visible">
    <!-- Area Fill -->
    <path
      :d="`M ${fillPath} Z`"
      :fill="color"
      fill-opacity="0.1"
      stroke="none"
    />
    <!-- Line -->
    <polyline
      :points="points"
      fill="none"
      :stroke="color"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
