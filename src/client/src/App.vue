<script setup lang="ts">
import { ref, onMounted, provide } from 'vue';
import { useRoute, RouterView } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import HeaderBar from './components/HeaderBar.vue';

const route = useRoute();

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
  ga4Id: string | null;
}

const selectedAccount = ref<MaxAccount | null>(null);

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
