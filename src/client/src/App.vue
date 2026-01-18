<script setup lang="ts">
import { ref, onMounted, provide, computed } from 'vue';
import { useRoute, RouterView } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import HeaderBar from './components/HeaderBar.vue';
import { Sparkles, MessageSquare, X } from 'lucide-vue-next';
import 'deep-chat';

const route = useRoute();

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
  ga4Id: string | null;
  shopifyId: string | null;
  instagramId: string | null;
  facebookPageId: string | null;
}

const selectedAccount = ref<MaxAccount | null>(null);

// Chat State
const showChat = ref(false);
const chatContext = computed(() => {
  if (!selectedAccount?.value) return {};
  const acc = selectedAccount.value;
  return {
    accountId: acc.id,
    googleAdsId: acc.googleAdsId,
    facebookAdsId: acc.facebookAdsId,
    ga4Id: acc.ga4Id,
    shopifyId: acc.shopifyId,
    instagramId: acc.instagramId,
    facebookPageId: acc.facebookPageId
  };
});

const loadAccountState = () => {
  const savedAccounts = localStorage.getItem('maxMarketingAccounts');
  const savedSelectionId = localStorage.getItem('selectedMaxAccountId');

  if (savedAccounts) {
    const maxAccounts: MaxAccount[] = JSON.parse(savedAccounts);
    if (maxAccounts.length > 0) {
      selectedAccount.value = maxAccounts.find(a => a.id === savedSelectionId) || maxAccounts[0];
    }
  }
};

const selectAccount = (account: MaxAccount) => {
  selectedAccount.value = account;
  localStorage.setItem('selectedMaxAccountId', account.id);
  window.dispatchEvent(new Event('accounts-updated'));
};

onMounted(() => {
  loadAccountState();
  window.addEventListener('accounts-updated', loadAccountState);
});

provide('selectedAccount', selectedAccount);
provide('selectAccount', selectAccount);
</script>

<template>
  <div
    class="flex h-screen w-full transition-theme overflow-hidden bg-amplify-dark"
  >
    <Sidebar />
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
      <HeaderBar :route-name="route.name?.toString() || ''" />
      <main class="flex-1 overflow-hidden relative">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </main>
    </div>

    <!-- Floating Chat Toggle -->
    <button
      @click="showChat = !showChat"
      class="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 transition-all z-50 group"
    >
      <MessageSquare v-if="!showChat" :size="28" />
      <X v-else :size="28" />
      <div
        class="absolute right-full mr-4 bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
      >
        Ask Max anything about your data
      </div>
    </button>

    <!-- Chat Drawer -->
    <div
      v-show="showChat"
      class="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[60] border-l border-slate-200 flex flex-col"
    >
      <!-- Header -->
      <div
        class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-none"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100"
          >
            <Sparkles :size="20" />
          </div>
          <div>
            <h3 class="font-bold text-slate-900">Max Analysis Agent</h3>
            <p
              class="text-[10px] text-slate-400 uppercase font-black tracking-widest"
            >
              Active • Cross-Platform Brain
            </p>
          </div>
        </div>
        <button
          @click="showChat = false"
          class="text-slate-400 hover:text-slate-600"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Chat Area -->
      <div class="flex-1 min-h-0 overflow-hidden">
        <deep-chat
          demo="true"
          speechToText="true"
          browserStorage="true"
          :connect="{
            url: '/api/chat',
            method: 'POST',
            additionalBodyProps: { context: chatContext }
          }"
          :introMessage="{ text: 'Hi! I\'m Max. I can analyze your ad performance, detect waste, and answer specific questions about your Google, Meta, or Shopify data. What can I help you with today?' }"
          style="height: 100%; width: 100%; border: none; display: block;"
          :messageStyles='{
            "default": {
              "user": { "bubble": { "backgroundColor": "#4f46e5", "maxWidth": "85%" } },
              "ai": { "bubble": { "backgroundColor": "#f8fafc", "color": "#1e293b", "border": "1px solid #e2e8f0", "maxWidth": "95%", "overflowX": "auto" } }
            }
          }'
        ></deep-chat>
      </div>
    </div>
  </div>
</template>
