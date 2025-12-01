<script setup lang="ts">
import { useRoute, RouterView } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import HeaderBar from './components/HeaderBar.vue';

const route = useRoute();
</script>

<template>
  <div class="flex h-screen w-full transition-theme overflow-hidden bg-amplify-dark">
    <Sidebar />
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
      <HeaderBar :route-name="route.name?.toString() || ''" />
      <main class="flex-1 overflow-hidden relative">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </main>
    </div>
  </div>
</template>
