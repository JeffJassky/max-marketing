<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  MapPin,
  Settings,
  ChevronRight,
  ChevronDown,
  Lock,
  MessageSquare,
  HelpCircle,
  Search,
  Hash,
  Star,
  Globe
} from 'lucide-vue-next';
import AccountSelector from './AccountSelector.vue';
const router = useRouter();
const route = useRoute();

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  {
    id: 'brand-voice',
    icon: MessageSquare,
    label: 'Brand Voice Tracker',
    path: '/brand-voice',
    children: [
      { id: 'brand-voice-overview', label: 'Overview', path: '/brand-voice' },
      { id: 'brand-voice-search', label: 'Search', path: '/brand-voice/search', icon: Search },
      { id: 'brand-voice-social', label: 'Social', path: '/brand-voice/social', icon: Hash },
      { id: 'brand-voice-reviews', label: 'Reviews', path: '/brand-voice/reviews', icon: Star },
      { id: 'brand-voice-website', label: 'Website', path: '/brand-voice/website', icon: Globe }
    ]
  },
  { id: 'google-ads', icon: BarChart3, label: 'Google Ads Suite', path: '/google-ads' },
  { id: 'social-spark', icon: Sparkles, label: 'Social Spark', path: '/social-spark' },
  { id: 'local-seo', icon: MapPin, label: 'Local SEO', path: '/local-seo', locked: true },
  { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' }
];

const setView = (item: typeof navItems[number]) => {
  if (item.locked) return;
  router.push(item.path);
};

const isActive = (item: typeof navItems[number]) => {
  if (item.id === 'dashboard') return route.path === '/';
  return route.path.startsWith(item.path);
};

const isBrandVoiceOpen = computed(() => route.path.startsWith('/brand-voice'));
const isChildActive = (childPath: string) => route.path === childPath;
</script>

<template>
  <aside class="w-64 bg-amplify-dark border-r border-slate-800 flex flex-col h-full transition-theme flex-shrink-0 z-20">
    <div class="p-6">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-amplify-green rounded-lg flex items-center justify-center text-amplify-darker font-bold text-xl relative overflow-hidden">
          <span class="z-10">M</span>
          <div class="absolute top-0 right-0 w-4 h-4 bg-white/30 rounded-bl-lg" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-white tracking-tight leading-none">MAXED</h1>
          <p class="text-[10px] text-amplify-green font-mono tracking-widest uppercase">Marketing.OS</p>
        </div>
      </div>
    </div>

    <AccountSelector />

    <nav class="flex-1 px-3 space-y-1 mt-4">
      <div class="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Apps</div>
      <div v-for="item in navItems" :key="item.id" class="space-y-1">
        <div
          @click="() => setView(item)"
          class="flex items-center justify-between px-3 py-3 rounded-xl transition-all cursor-pointer group relative"
          :class="[
            isActive(item)
              ? 'bg-slate-800 text-amplify-green border border-slate-700'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent',
            item.locked ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        >
          <div class="flex items-center gap-3">
            <component
              :is="item.icon"
              :size="20"
              class="transition-colors"
              :class="isActive(item) ? 'text-amplify-green' : 'text-slate-500 group-hover:text-slate-300'"
            />
            <span class="text-sm" :class="isActive(item) ? 'font-bold' : 'font-medium'">{{ item.label }}</span>
          </div>
          <div class="flex items-center gap-2">
            <ChevronDown v-if="item.children" :size="16" :class="isBrandVoiceOpen ? 'text-amplify-green' : 'text-slate-500'" />
            <ChevronRight v-else-if="isActive(item)" :size="14" class="text-amplify-green" />
            <Lock v-if="item.locked" :size="12" class="text-slate-600" />
          </div>
        </div>

        <div
          v-if="item.children && isBrandVoiceOpen"
          class="ml-2 pl-4 border-l border-slate-800 space-y-1"
        >
          <button
            v-for="child in item.children"
            :key="child.id"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            :class="isChildActive(child.path) ? 'text-amplify-green bg-slate-800/60' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40'"
            @click="router.push(child.path)"
          >
            <component v-if="child.icon" :is="child.icon" :size="14" />
            <span>{{ child.label }}</span>
          </button>
        </div>
      </div>
    </nav>

    <div class="p-4">
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700">
        <div class="flex items-center gap-2 text-amplify-green mb-2">
          <HelpCircle :size="18" />
          <span class="font-bold text-sm">Need a hand?</span>
        </div>
        <p class="text-xs text-slate-400 mb-3">Our marketing guides are here to support your growth.</p>
        <button class="w-full bg-amplify-green py-2 rounded-lg text-xs font-bold text-amplify-darker hover:bg-white transition-colors">
          Open Guide
        </button>
      </div>
    </div>
  </aside>
</template>
