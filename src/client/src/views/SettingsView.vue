<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Save, Edit } from 'lucide-vue-next';

interface PlatformAccount {
  id: string;
  name: string;
}

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
  ga4Id: string | null;
  shopifyId: string | null;
  instagramId: string | null;
  facebookPageId: string | null;
  gscId: string | null;
}

const platformAccounts = ref<{
  google: PlatformAccount[],
  facebook: PlatformAccount[],
  ga4: PlatformAccount[],
  shopify: PlatformAccount[],
  instagram: PlatformAccount[],
  facebook_organic: PlatformAccount[],
  gsc: PlatformAccount[]
}>({
  google: [],
  facebook: [],
  ga4: [],
  shopify: [],
  instagram: [],
  facebook_organic: [],
  gsc: []
});

const accounts = ref<MaxAccount[]>([]);
const isEditing = ref<string | null>(null);
const editForm = ref<MaxAccount>({
  id: '',
  name: '',
  googleAdsId: null,
  facebookAdsId: null,
  ga4Id: null,
  shopifyId: null,
  instagramId: null,
  facebookPageId: null,
  gscId: null
});

const loadPlatformAccounts = async () => {
  try {
    const res = await fetch('/api/platform-accounts', { credentials: 'include' });
    platformAccounts.value = await res.json();
  } catch (e) {
    console.error("Failed to load platform accounts", e);
  }
};

const loadAccounts = async () => {
  try {
    const res = await fetch('/api/accounts', { credentials: 'include' });
    accounts.value = await res.json();
  } catch (e) {
    console.error("Failed to load accounts", e);
  }
};

const startEdit = (account: MaxAccount) => {
  isEditing.value = account.id;
  editForm.value = { ...account };
};

const cancelEdit = () => {
  isEditing.value = null;
};

const saveEdit = async () => {
  try {
    await fetch(`/api/accounts/${editForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editForm.value)
    });
    const idx = accounts.value.findIndex(a => a.id === editForm.value.id);
    if (idx !== -1) accounts.value[idx] = { ...editForm.value };
    window.dispatchEvent(new Event('accounts-updated'));
    isEditing.value = null;
  } catch (e) {
    console.error("Failed to save account", e);
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
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-800">Settings</h1>
        <p class="text-sm text-slate-500 mt-1">Manage platform connections for your accounts.</p>
      </div>

      <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-stone-100 bg-stone-50/50">
          <h2 class="font-bold text-slate-800">Platform Connections</h2>
          <p class="text-xs text-slate-500 mt-1">Link your ad platforms and analytics properties to your accounts.</p>
        </div>

        <div class="divide-y divide-stone-100">
          <div v-for="account in accounts" :key="account.id" class="p-6 hover:bg-stone-50 transition-colors">

            <!-- Edit Mode -->
            <div v-if="isEditing === account.id" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Account Name</label>
                <input v-model="editForm.name" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1 flex items-center">
                    <img src="https://www.gstatic.com/analytics/20140414/common/images/logos/logo_analytics_192px.png" class="w-4 h-4 mr-1"/> GA4 Property ID
                  </label>
                  <select v-model="editForm.ga4Id" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select Property...</option>
                    <option v-for="ga4 in platformAccounts.ga4" :key="ga4.id" :value="ga4.id">
                      {{ ga4.name }} ({{ ga4.id }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1 flex items-center">
                    <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" class="w-4 h-4 mr-1"/> Search Console
                  </label>
                  <select v-model="editForm.gscId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select Property...</option>
                    <option v-for="gsc in platformAccounts.gsc" :key="gsc.id" :value="gsc.id">
                      {{ gsc.name }} ({{ gsc.id }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1 flex items-center">
                    <img src="https://cdn.shopify.com/s/files/1/0268/5675/files/shopify_favicon.png" class="w-4 h-4 mr-1"/> Shopify Shop ID
                  </label>
                  <select v-model="editForm.shopifyId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select Shop...</option>
                    <option v-for="shop in platformAccounts.shopify" :key="shop.id" :value="shop.id">
                      {{ shop.name }} ({{ shop.id }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1 flex items-center">
                    <img src="https://www.instagram.com/static/images/ico/favicon.ico/36b304827462.ico" class="w-4 h-4 mr-1"/> Instagram ID
                  </label>
                  <select v-model="editForm.instagramId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select Instagram...</option>
                    <option v-for="inst in platformAccounts.instagram" :key="inst.id" :value="inst.id">
                      {{ inst.name }} ({{ inst.id }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1 flex items-center">
                    <div class="w-4 h-4 bg-blue-800 rounded mr-1 flex items-center justify-center text-[10px] text-white font-bold">f</div> FB Page ID
                  </label>
                  <select v-model="editForm.facebookPageId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select Page...</option>
                    <option v-for="fbo in platformAccounts.facebook_organic" :key="fbo.id" :value="fbo.id">
                      {{ fbo.name }} ({{ fbo.id }})
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
                <div class="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                  <div class="flex items-center">
                    <span class="w-2 h-2 rounded-full mr-2" :class="account.googleAdsId ? 'bg-green-500' : 'bg-slate-300'"></span>
                    Google: {{ account.googleAdsId ? platformAccounts.google.find(g => g.id === account.googleAdsId)?.name || account.googleAdsId : 'Not Linked' }}
                  </div>
                  <div class="flex items-center">
                    <span class="w-2 h-2 rounded-full mr-2" :class="account.facebookAdsId ? 'bg-blue-500' : 'bg-slate-300'"></span>
                    Facebook: {{ account.facebookAdsId ? platformAccounts.facebook.find(f => f.id === account.facebookAdsId)?.name || account.facebookAdsId : 'Not Linked' }}
                  </div>
                  <div class="flex items-center">
                    <span class="w-2 h-2 rounded-full mr-2" :class="account.ga4Id ? 'bg-orange-500' : 'bg-slate-300'"></span>
                    GA4: {{ account.ga4Id ? platformAccounts.ga4.find(g => g.id === account.ga4Id)?.name || account.ga4Id : 'Not Linked' }}
                  </div>
                  <div class="flex items-center">
                    <span class="w-2 h-2 rounded-full mr-2" :class="account.gscId ? 'bg-yellow-500' : 'bg-slate-300'"></span>
                    GSC: {{ account.gscId ? platformAccounts.gsc.find(g => g.id === account.gscId)?.name || account.gscId : 'Not Linked' }}
                  </div>
                  <div class="flex items-center">
                    <span class="w-2 h-2 rounded-full mr-2" :class="account.shopifyId ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                    Shopify: {{ account.shopifyId ? platformAccounts.shopify.find(s => s.id === account.shopifyId)?.name || account.shopifyId : 'Not Linked' }}
                  </div>
                  <div class="flex items-center">
                    <span class="w-2 h-2 rounded-full mr-2" :class="account.instagramId ? 'bg-pink-500' : 'bg-slate-300'"></span>
                    Instagram: {{ account.instagramId ? platformAccounts.instagram.find(i => i.id === account.instagramId)?.name || account.instagramId : 'Not Linked' }}
                  </div>
                  <div class="flex items-center">
                    <span class="w-2 h-2 rounded-full mr-2" :class="account.facebookPageId ? 'bg-blue-800' : 'bg-slate-300'"></span>
                    FB Page: {{ account.facebookPageId ? platformAccounts.facebook_organic.find(f => f.id === account.facebookPageId)?.name || account.facebookPageId : 'Not Linked' }}
                  </div>
                </div>
              </div>
              <button @click="startEdit(account)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Edit class="w-4 h-4" />
              </button>
            </div>

          </div>

          <div v-if="accounts.length === 0" class="p-8 text-center text-slate-400 text-sm">
            No accounts available. Contact your admin to get account access.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
