<script setup lang="ts">
import { computed } from 'vue';
import { Bell, Search } from 'lucide-vue-next';
import type { Theme } from '../types';

const props = defineProps<{
  theme: Theme;
  routeName: string;
}>();

const title = computed(() => {
  if (props.routeName === 'dashboard') return props.theme === 'focus' ? 'My Momentum' : 'CMD_CENTER_V2';
  if (props.routeName === 'brand-voice') return props.theme === 'focus' ? 'Brand Voice Tracker' : 'VOICE_ANALYSIS_LOG';
  if (props.routeName === 'google-ads') return props.theme === 'focus' ? 'Google Ads Suite' : 'G_ADS_PROTOCOL';
  if (props.routeName === 'social-spark') return props.theme === 'focus' ? 'Social Spark' : 'SOCIAL_GEN_MODULE';
  return props.theme === 'focus' ? 'Dashboard' : 'SYSTEM_VIEW';
});

const isFocus = computed(() => props.theme === 'focus');
</script>

<template>
  <header class="h-16 flex-shrink-0 bg-amplify-dark border-b border-slate-800 px-8 flex justify-between items-center z-10">
    <div class="flex items-center gap-4">
      <h2 class="text-lg text-white" :class="isFocus ? 'font-sans font-semibold' : 'font-mono tracking-wide'">{{ title }}</h2>
      <span v-if="!isFocus" class="px-2 py-0.5 bg-amplify-green/10 text-amplify-green text-[10px] font-mono border border-amplify-green/20">LIVE_DATA</span>
    </div>
    <div class="flex gap-4 items-center">
      <div class="hidden md:flex items-center bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700">
        <Search :size="16" :class="isFocus ? 'text-amplify-purple mr-2' : 'text-slate-400 mr-2'" />
        <input
          type="text"
          placeholder="Search..."
          class="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-32 focus:w-48 transition-all"
        />
      </div>
      <button class="relative p-2 text-slate-400 hover:text-white transition-colors">
        <Bell :size="20" />
        <span class="absolute top-1 right-1 w-2 h-2 bg-amplify-green rounded-full"></span>
      </button>
      <div class="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white">
        AL
      </div>
    </div>
  </header>
</template>
