<script setup lang="ts">
import { computed } from 'vue';
import { Bell, Search } from 'lucide-vue-next';
import GlobalDateSelector from './GlobalDateSelector.vue';
import GlobalMonthSelector from './GlobalMonthSelector.vue';

const props = defineProps<{
  routeName: string;
}>();

const title = computed(() => {
  if (props.routeName === 'dashboard') return 'My Momentum';
  if (props.routeName?.startsWith('brand-voice')) return 'Brand Voice Tracker';
  if (props.routeName === 'google-ads') return 'Google Ads Suite';
  if (props.routeName === 'social-spark') return 'Social Spark';
  return 'Dashboard';
});

const showDateSelector = computed(() => {
  const allowed = ['dashboard', 'overviews', 'creative-lab', 'monitors', 'google-ads'];
  return allowed.includes(props.routeName);
});

const showMonthSelector = computed(() => {
  const allowed = ['superlatives', 'report-builder'];
  return allowed.includes(props.routeName);
});
</script>

<template>
  <header class="h-16 flex-shrink-0 bg-amplify-dark border-b border-slate-800 px-8 flex justify-between items-center z-50">
    <div class="flex items-center gap-4">
      <h2 class="text-lg text-white font-sans font-semibold">{{ title }}</h2>
    </div>
    <div class="flex gap-4 items-center">
      <GlobalDateSelector v-if="showDateSelector" />
      <GlobalMonthSelector v-if="showMonthSelector" />
      <div class="hidden md:flex items-center bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700">
        <Search :size="16" class="text-amplify-purple mr-2" />
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
