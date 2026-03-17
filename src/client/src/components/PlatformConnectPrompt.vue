<script setup lang="ts">
import { type Component } from 'vue';
import { ExternalLink } from 'lucide-vue-next';

const props = defineProps<{
  platformName: string;
  platformIcon: Component;
  accountId: string;
}>();

const handleConnect = () => {
  window.open(`/api/connect-accounts?accountId=${encodeURIComponent(props.accountId)}`, '_blank');
};
</script>

<template>
  <div class="flex items-center justify-center py-24 px-4">
    <div class="text-center max-w-md">
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 mb-6">
        <component
          :is="platformIcon"
          class="w-10 h-10 text-slate-400"
        />
      </div>

      <h2 class="text-xl font-bold text-slate-900 mb-2">
        Connect {{ platformName }}
      </h2>
      <p class="text-sm text-slate-500 mb-8">
        This platform isn't connected to your account yet.
      </p>

      <button
        @click="handleConnect"
        class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
      >
        Request Connection to {{ platformName }}
        <ExternalLink class="w-4 h-4 opacity-70" />
      </button>
    </div>
  </div>
</template>
