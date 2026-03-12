<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  ChevronRight,
  HelpCircle,
  Trophy,
  Image as ImageIcon,
  FileText,
  ShieldCheck
} from 'lucide-vue-next';
import AccountSelector from './AccountSelector.vue';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { id: 'overviews', icon: BarChart3, label: 'Overviews', path: '/overviews' },
  { id: 'superlatives', icon: Trophy, label: 'Hall of Fame', path: '/superlatives' },
  { id: 'creative-lab', icon: ImageIcon, label: 'Creative Lab', path: '/creative-lab' },
  { id: 'report-builder', icon: FileText, label: 'Report Builder', path: '/report-builder' },
  { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' }
];

const setView = (item: typeof navItems[number]) => {
  router.push(item.path);
};

const isActive = (item: typeof navItems[number]) => {
  if (item.id === 'dashboard') return route.path === '/';
  if (item.id === 'admin') return route.path === '/admin';
  return route.path.startsWith(item.path);
};

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

    <nav class="flex-1 px-3 space-y-1 mt-4 overflow-y-auto">
      <div class="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Apps</div>
      <div v-for="item in navItems" :key="item.id" class="space-y-1">
        <div
          @click="() => setView(item)"
          class="flex items-center justify-between px-3 py-3 rounded-xl transition-all cursor-pointer group relative"
          :class="[
            isActive(item)
              ? 'bg-slate-800 text-amplify-green border border-slate-700'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
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
          <ChevronRight v-if="isActive(item)" :size="14" class="text-amplify-green" />
        </div>
      </div>

      <!-- Admin nav item (admin only) -->
      <div v-if="authStore.isAdmin" class="mt-2 pt-2 border-t border-slate-800">
        <div class="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</div>
        <div
          @click="router.push('/admin')"
          class="flex items-center justify-between px-3 py-3 rounded-xl transition-all cursor-pointer group"
          :class="[
            route.path === '/admin'
              ? 'bg-slate-800 text-amplify-green border border-slate-700'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
          ]"
        >
          <div class="flex items-center gap-3">
            <ShieldCheck :size="20" class="transition-colors" :class="route.path === '/admin' ? 'text-amplify-green' : 'text-slate-500 group-hover:text-slate-300'" />
            <span class="text-sm" :class="route.path === '/admin' ? 'font-bold' : 'font-medium'">Admin</span>
          </div>
          <ChevronRight v-if="route.path === '/admin'" :size="14" class="text-amplify-green" />
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
