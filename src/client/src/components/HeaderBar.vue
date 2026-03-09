<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Search, LogOut, ChevronDown } from 'lucide-vue-next';
import GlobalDateSelector from './GlobalDateSelector.vue';
import GlobalMonthSelector from './GlobalMonthSelector.vue';
import { useAuthStore } from '../stores/auth';

const props = defineProps<{
  routeName: string;
}>();

const router = useRouter();
const authStore = useAuthStore();
const showUserMenu = ref(false);

const showDateSelector = computed(() => {
  const allowed = ['dashboard', 'overviews', 'creative-lab', 'monitors', 'google-ads'];
  return allowed.includes(props.routeName);
});

const showMonthSelector = computed(() => {
  const allowed = ['superlatives', 'report-builder'];
  return allowed.includes(props.routeName);
});

const userInitials = computed(() => {
  if (!authStore.user) return '?';
  const parts = authStore.user.name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
});

const handleLogout = async () => {
  showUserMenu.value = false;
  await authStore.logout();
  router.push('/login');
};

const closeMenu = () => {
  showUserMenu.value = false;
};
</script>

<template>
  <header class="h-16 flex-shrink-0 bg-white border-b border-slate-200 px-8 flex justify-end items-center z-50">
    <div class="flex gap-4 items-center">
      <GlobalDateSelector v-if="showDateSelector" />
      <GlobalMonthSelector v-if="showMonthSelector" />
      <div class="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200">
        <Search :size="16" class="text-indigo-500 mr-2" />
        <input
          type="text"
          placeholder="Search..."
          class="bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 w-32 focus:w-48 transition-all"
        />
      </div>
      <button class="relative p-2 text-slate-400 hover:text-slate-800 transition-colors">
        <Bell :size="20" />
        <span class="absolute top-1 right-1 w-2 h-2 bg-amplify-green rounded-full"></span>
      </button>

      <!-- User avatar dropdown -->
      <div class="relative">
        <button
          @click="showUserMenu = !showUserMenu"
          class="flex items-center gap-2 group"
        >
          <div class="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center text-xs font-bold text-white">
            {{ userInitials }}
          </div>
          <ChevronDown :size="14" class="text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>

        <!-- Dropdown -->
        <div
          v-if="showUserMenu"
          class="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
        >
          <div class="px-4 py-3 border-b border-slate-800">
            <div class="text-sm font-bold text-white">{{ authStore.user?.name }}</div>
            <div class="text-xs text-slate-400">{{ authStore.user?.email }}</div>
          </div>
          <button
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut :size="16" />
            Sign out
          </button>
        </div>

        <!-- Click outside to close -->
        <div v-if="showUserMenu" class="fixed inset-0 z-40" @click="closeMenu"></div>
      </div>
    </div>
  </header>
</template>
