<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import ThemeSwitcher from './components/ThemeSwitcher.vue';
import type { Theme } from './types';
import { RouterView } from 'vue-router';
import HeaderBar from './components/HeaderBar.vue';

const theme = ref<Theme>('focus');
const route = useRoute();

const mainBg = computed(() => (theme.value === 'focus' ? 'bg-stone-50' : 'bg-amplify-darker'));

const setTheme = (next: Theme) => {
  theme.value = next;
};
</script>

<template>
  <div class="flex h-screen w-full transition-theme overflow-hidden" :class="theme === 'focus' ? 'bg-amplify-dark' : 'bg-amplify-darker'">
    <Sidebar :theme="theme" />
    <div class="flex-1 flex flex-col h-full overflow-hidden" :class="mainBg">
      <HeaderBar :theme="theme" :route-name="route.name?.toString() || ''" />
      <main class="flex-1 overflow-hidden relative">
        <RouterView v-slot="{ Component }">
          <component :is="Component" :theme="theme" />
        </RouterView>
      </main>
    </div>
    <ThemeSwitcher :current-theme="theme" @set-theme="setTheme" />
  </div>
</template>
