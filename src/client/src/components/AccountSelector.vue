<script setup lang="ts">
import { ref, onMounted, inject, type Ref } from 'vue';
import { Wallet, ChevronDown, CheckCircle, Settings } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();

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

const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');
const selectAccountGlobal = inject<(account: MaxAccount) => void>('selectAccount');

const maxAccounts = ref<MaxAccount[]>([]);
const isOpen = ref(false);
let closeTimeout: ReturnType<typeof setTimeout> | null = null;

const loadMaxAccounts = async () => {
  try {
    const res = await fetch('/api/accounts');
    const data = await res.json();
    maxAccounts.value = data;
  } catch (e) {
    console.error('Failed to load accounts', e);
  }
};

const selectAccount = (account: MaxAccount) => {
  if (selectAccountGlobal) {
    selectAccountGlobal(account);
  }
  isOpen.value = false;
};

const openDropdown = () => {
  if (closeTimeout) clearTimeout(closeTimeout);
  isOpen.value = true;
};

const closeDropdown = () => {
  closeTimeout = setTimeout(() => {
    isOpen.value = false;
  }, 300); // 300ms delay to allow moving cursor to dropdown
};

const keepOpen = () => {
  if (closeTimeout) clearTimeout(closeTimeout);
  isOpen.value = true;
};

onMounted(() => {
  loadMaxAccounts();
  window.addEventListener('accounts-updated', loadMaxAccounts);
});
</script>

<template>
  <div class="relative px-3 mb-6" @mouseleave="closeDropdown">
    <button
      @mouseenter="openDropdown"
      class="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-left hover:bg-slate-800 hover:border-slate-600 transition-all group"
    >
      <div class="flex items-center min-w-0">
        <div
          class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/20 transition-colors mr-3 shrink-0"
        >
          <Wallet :size="16" />
        </div>
        <div class="truncate">
          <p
            class="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5"
          >
            Account
          </p>
          <p
            v-if="selectedAccount"
            class="text-sm font-bold text-slate-200 truncate"
          >
            {{ selectedAccount.name }}
          </p>
          <p v-else class="text-sm text-slate-500 italic">Select Account</p>
        </div>
      </div>
      <ChevronDown
        :size="16"
        class="text-slate-500 group-hover:text-slate-300 ml-2 shrink-0"
      />
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      @mouseenter="keepOpen"
      @mouseleave="closeDropdown"
      class="absolute top-full left-3 right-3 mt-2 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top"
    >
      <div class="max-h-64 overflow-y-auto custom-scrollbar">
        <div
          v-if="!maxAccounts.length"
          class="px-4 py-3 text-sm text-slate-400 italic text-center"
        >
          No accounts found.
        </div>
        <button
          v-else
          v-for="account in maxAccounts"
          :key="account.id"
          @click="selectAccount(account)"
          class="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-center justify-between transition-colors border-b border-slate-700/50 last:border-0 group"
        >
          <div class="min-w-0 pr-2">
            <p
              class="text-sm font-bold text-slate-200 group-hover:text-white truncate"
            >
              {{ account.name }}
            </p>
            <div class="flex items-center gap-2 mt-0.5">
              <span
                class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono"
                :class="'text-green-400 bg-green-400/10'"
                v-if="account.googleAdsId"
                >G</span
              >
              <span
                class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono"
                :class="'text-green-400 bg-green-400/10'"
                v-if="account.facebookAdsId"
                >F</span
              >
              <span
                class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono"
                :class="'text-green-400 bg-green-400/10'"
                v-if="account.ga4Id"
                >GA</span
              >
              <span
                class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono"
                :class="'text-green-400 bg-green-400/10'"
                v-if="account.shopifyId"
                >S</span
              >
              <span
                class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono"
                :class="'text-green-400 bg-green-400/10'"
                v-if="account.instagramId"
                >IG</span
              >
              <span
                class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono"
                :class="'text-green-400 bg-green-400/10'"
                v-if="account.facebookPageId"
                >FB</span
              >
            </div>
          </div>
          <CheckCircle
            v-if="selectedAccount?.id === account.id"
            :size="16"
            class="text-amplify-green shrink-0"
          />
        </button>
      </div>

      <div class="p-2 bg-slate-900/50 border-t border-slate-700">
        <button
          @click="router.push('/settings'); isOpen = false;"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <Settings :size="14" />
          Manage Accounts
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}
</style>
