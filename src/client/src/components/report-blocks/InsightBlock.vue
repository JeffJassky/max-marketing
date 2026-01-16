<script setup lang="ts">
import * as icons from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  text: string;
  icon?: string;
}>();

const IconComponent = computed(() => {
  if (!props.icon) return icons.Lightbulb;
  // @ts-ignore
  return icons[props.icon] || icons.Lightbulb;
});
</script>

<template>
  <div class="rounded-[2.5rem] bg-indigo-50/50 p-10 border border-indigo-100/50 flex gap-6 items-start shadow-sm">
    <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-indigo-100 shadow-lg text-indigo-600 shrink-0">
      <component :is="IconComponent" :size="28" />
    </div>
    <div>
      <h4 class="text-xl font-bold text-slate-800 mb-2">{{ title }}</h4>
      <p class="text-slate-600 font-medium leading-relaxed">
        {{ text }}
      </p>
    </div>
  </div>
</template>
