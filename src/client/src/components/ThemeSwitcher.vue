<script setup lang="ts">
import { Layout, Zap } from 'lucide-vue-next';
import type { Theme } from '../types';

const props = defineProps<{ currentTheme: Theme }>();
const emit = defineEmits<{ (e: 'set-theme', theme: Theme): void }>();
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex bg-amplify-dark/90 backdrop-blur-md p-1.5 rounded-full border border-slate-700 shadow-2xl">
    <button
      @click="emit('set-theme', 'focus')"
      class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300"
      :class="currentTheme === 'focus' ? 'bg-amplify-green text-amplify-darker shadow-lg' : 'text-slate-400 hover:text-white'"
    >
      <Layout :size="16" />
      Focus Mode
    </button>
    <button
      @click="emit('set-theme', 'executive')"
      class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300"
      :class="currentTheme === 'executive' ? 'bg-amplify-secondary text-white shadow-lg' : 'text-slate-400 hover:text-white'"
    >
      <Zap :size="16" />
      Executive Mode
    </button>
  </div>
</template>
