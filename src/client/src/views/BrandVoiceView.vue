<script setup lang="ts">
import { computed } from 'vue';
import { MessageSquare } from 'lucide-vue-next';
import type { Theme } from '../types';

const props = defineProps<{ theme: Theme }>();
const isFocus = computed(() => props.theme === 'focus');
</script>

<template>
  <div v-if="isFocus" class="h-full flex flex-col items-center justify-center p-8 bg-stone-50 animate-in fade-in duration-500 text-center">
    <div class="w-20 h-20 bg-white rounded-[2rem] shadow-sm border border-stone-100 flex items-center justify-center text-amplify-purple mb-6">
      <MessageSquare :size="40" />
    </div>
    <h1 class="text-4xl font-bold text-slate-800 mb-4">Brand Voice Tracker</h1>
    <p class="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
      We're building a dedicated space to track, analyze, and perfect your brand's voice across every channel.
    </p>
    <div class="mt-8 px-4 py-2 bg-amplify-purple/10 text-amplify-purple rounded-full text-sm font-bold">
      Coming Soon
    </div>
  </div>
  <div v-else class="h-full flex flex-col items-center justify-center p-8 bg-amplify-darker font-mono animate-in fade-in duration-500 text-slate-400">
    <div class="border border-slate-800 p-8 bg-slate-900/50 flex flex-col items-center">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-2 h-2 bg-yellow-500 animate-pulse" />
        <span class="text-yellow-500 tracking-widest uppercase">Construction_Mode</span>
      </div>
      <h1 class="text-2xl text-white mb-2">VOICE_TRACKER.mod</h1>
      <p class="text-xs max-w-md text-center">
        MODULE INITIALIZATION PENDING.
        DATA STREAM NOT ESTABLISHED.
      </p>
    </div>
  </div>
</template>
