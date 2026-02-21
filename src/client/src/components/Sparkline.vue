<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}>();

const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 30;

const points = computed(() => {
  const data = props.data;
  if (!data || data.length < 2) return '';

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = (max - min) || 1;

  // X step normalized to viewBox width
  const stepX = VIEWBOX_WIDTH / (data.length - 1);

  return data.map((val, index) => {
    const x = index * stepX;
    // Invert Y (SVG 0 is top)
    const normalizedY = (val - min) / range;
    const y = VIEWBOX_HEIGHT - (normalizedY * VIEWBOX_HEIGHT);
    return `${x},${y}`;
  }).join(' ');
});

const fillPath = computed(() => {
  if (!points.value) return '';
  return `M 0,${VIEWBOX_HEIGHT} ${points.value.split(' ').map((p, i) => (i === 0 ? 'L ' + p : p)).join(' ')} L ${VIEWBOX_WIDTH},${VIEWBOX_HEIGHT} Z`;
});
</script>

<template>
  <svg 
    :viewBox="`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`" 
    preserveAspectRatio="none" 
    class="w-full h-full overflow-visible"
  >
    <!-- Area Fill -->
    <path
      :d="fillPath"
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
