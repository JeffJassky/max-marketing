<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Trash2, Save, Edit } from 'lucide-vue-next';

interface PlatformAccount {
  id: string;
  name: string;
}

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
}

const platformAccounts = ref<{ google: PlatformAccount[], facebook: PlatformAccount[] }>({
  google: [],
  facebook: []
});

const accounts = ref<MaxAccount[]>([]);
const isEditing = ref<string | null>(null); // ID of account being edited
const editForm = ref<MaxAccount>({ id: '', name: '', googleAdsId: null, facebookAdsId: null });

// Load platform accounts
const loadPlatformAccounts = async () => {
  try {
    const res = await fetch('/api/platform-accounts');
    platformAccounts.value = await res.json();
  } catch (e) {
    console.error("Failed to load platform accounts", e);
  }
};

// Load saved accounts
const loadAccounts = () => {
  const saved = localStorage.getItem('maxMarketingAccounts');
  if (saved) {
    accounts.value = JSON.parse(saved);
  } else {
    // Default seed if empty
    const defaultId = crypto.randomUUID();
    accounts.value = [{ 
      id: defaultId, 
      name: 'My First Account', 
      googleAdsId: null, 
      facebookAdsId: null 
    }];
    saveAccounts();
  }
};

const saveAccounts = () => {
  localStorage.setItem('maxMarketingAccounts', JSON.stringify(accounts.value));
  // Dispatch event so other components can react if needed (simple state management)
  window.dispatchEvent(new Event('accounts-updated'));
};

const startEdit = (account: MaxAccount) => {
  isEditing.value = account.id;
  editForm.value = { ...account };
};

const cancelEdit = () => {
  isEditing.value = null;
};

const saveEdit = () => {
  const idx = accounts.value.findIndex(a => a.id === editForm.value.id);
  if (idx !== -1) {
    accounts.value[idx] = { ...editForm.value };
    saveAccounts();
  }
  isEditing.value = null;
};

const createAccount = () => {
  const newAccount: MaxAccount = {
    id: crypto.randomUUID(),
    name: 'New Account',
    googleAdsId: null,
    facebookAdsId: null
  };
  accounts.value.push(newAccount);
  saveAccounts();
  startEdit(newAccount);
};

const deleteAccount = (id: string) => {
  if (confirm("Are you sure you want to delete this account?")) {
    accounts.value = accounts.value.filter(a => a.id !== id);
    saveAccounts();
  }
};

onMounted(() => {
  loadPlatformAccounts();
  loadAccounts();
});
</script>

<template>
  <div class="flex-1 p-8 bg-stone-50 overflow-y-auto h-full animate-in fade-in duration-500">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-slate-800">Settings</h1>
        <button @click="createAccount" class="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus class="w-4 h-4 mr-2" /> Create Account
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-stone-100 bg-stone-50/50">
          <h2 class="font-bold text-slate-800">Account Management</h2>
          <p class="text-xs text-slate-500 mt-1">Manage your MaxMarketing accounts and link them to ad platforms.</p>
        </div>
        
        <div class="divide-y divide-stone-100">
          <div v-for="account in accounts" :key="account.id" class="p-6 hover:bg-stone-50 transition-colors">
            
            <!-- Edit Mode -->
            <div v-if="isEditing === account.id" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Account Name</label>
                <input v-model="editForm.name" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1 flex items-center">
                    <img src="https://www.gstatic.com/images/branding/product/1x/ads_2022_48dp.png" class="w-4 h-4 mr-1"/> Google Ads ID
                  </label>
                  <select v-model="editForm.googleAdsId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select Account...</option>
                    <option v-for="ga in platformAccounts.google" :key="ga.id" :value="ga.id">
                      {{ ga.name }} ({{ ga.id }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1 flex items-center">
                    <div class="w-4 h-4 bg-blue-600 rounded-full mr-1 flex items-center justify-center text-[10px] text-white font-bold">f</div> Facebook Ads ID
                  </label>
                  <select v-model="editForm.facebookAdsId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select Account...</option>
                    <option v-for="fb in platformAccounts.facebook" :key="fb.id" :value="fb.id">
                      {{ fb.name }} ({{ fb.id }})
                    </option>
                  </select>
                </div>
              </div>

              <div class="flex justify-end gap-2 mt-4">
                <button @click="cancelEdit" class="px-4 py-2 text-sm text-slate-500 hover:bg-stone-100 rounded-lg font-medium">Cancel</button>
                <button @click="saveEdit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center shadow-sm">
                  <Save class="w-4 h-4 mr-2" /> Save Changes
                </button>
              </div>
            </div>

            <!-- View Mode -->
            <div v-else class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-slate-800">{{ account.name }}</h3>
                <div class="flex gap-4 mt-2 text-xs text-slate-500">
                  <div class="flex items-center">
                    <span class="w-2 h-2 rounded-full mr-2" :class="account.googleAdsId ? 'bg-green-500' : 'bg-slate-300'"></span>
                    Google: {{ account.googleAdsId ? platformAccounts.google.find(g => g.id === account.googleAdsId)?.name || account.googleAdsId : 'Not Linked' }}
                  </div>
                  <div class="flex items-center">
                    <span class="w-2 h-2 rounded-full mr-2" :class="account.facebookAdsId ? 'bg-blue-500' : 'bg-slate-300'"></span>
                    Facebook: {{ account.facebookAdsId ? platformAccounts.facebook.find(f => f.id === account.facebookAdsId)?.name || account.facebookAdsId : 'Not Linked' }}
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <button @click="startEdit(account)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Edit class="w-4 h-4" />
                </button>
                <button @click="deleteAccount(account.id)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>
