<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Users, Building2, Plus, Trash2, Save, Edit, X, Shield, User as UserIcon } from 'lucide-vue-next';

interface PlatformAccount { id: string; name: string; }
interface MaxAccount {
  id: string; name: string;
  googleAdsId: string | null; facebookAdsId: string | null; ga4Id: string | null;
  shopifyId: string | null; instagramId: string | null; facebookPageId: string | null; gscId: string | null;
}
interface Membership { id: string; accountId: string; role: string; }
interface AdminUser {
  id: string; email: string; name: string; role: 'admin' | 'user';
  createdAt: string; memberships: Membership[];
}

const activeTab = ref<'accounts' | 'users'>('accounts');

// --- Account state ---
const accounts = ref<MaxAccount[]>([]);
const platformAccounts = ref<{
  google: PlatformAccount[]; facebook: PlatformAccount[]; ga4: PlatformAccount[];
  shopify: PlatformAccount[]; instagram: PlatformAccount[]; facebook_organic: PlatformAccount[]; gsc: PlatformAccount[];
}>({ google: [], facebook: [], ga4: [], shopify: [], instagram: [], facebook_organic: [], gsc: [] });
const editingAccountId = ref<string | null>(null);
const newAccountIds = ref(new Set<string>());
const accountForm = ref<MaxAccount>({
  id: '', name: '', googleAdsId: null, facebookAdsId: null, ga4Id: null,
  shopifyId: null, instagramId: null, facebookPageId: null, gscId: null
});

// --- User state ---
const users = ref<AdminUser[]>([]);
const showUserModal = ref(false);
const editingUserId = ref<string | null>(null);
const userForm = ref({ name: '', email: '', password: '', role: 'user' as 'admin' | 'user', accountIds: [] as string[] });
const userError = ref('');

// --- Data loading ---
const loadAccounts = async () => {
  try {
    const res = await fetch('/api/accounts', { credentials: 'include' });
    accounts.value = await res.json();
  } catch (e) { console.error('Failed to load accounts', e); }
};

const loadPlatformAccounts = async () => {
  try {
    const res = await fetch('/api/platform-accounts', { credentials: 'include' });
    platformAccounts.value = await res.json();
  } catch (e) { console.error('Failed to load platform accounts', e); }
};

const loadUsers = async () => {
  try {
    const res = await fetch('/api/admin/users', { credentials: 'include' });
    users.value = await res.json();
  } catch (e) { console.error('Failed to load users', e); }
};

// --- Account CRUD ---
const startEditAccount = (account: MaxAccount) => {
  editingAccountId.value = account.id;
  accountForm.value = { ...account };
};

const cancelEditAccount = () => {
  if (editingAccountId.value && newAccountIds.value.has(editingAccountId.value)) {
    accounts.value = accounts.value.filter(a => a.id !== editingAccountId.value);
    newAccountIds.value.delete(editingAccountId.value!);
  }
  editingAccountId.value = null;
};

const saveAccount = async () => {
  try {
    const isNew = newAccountIds.value.has(accountForm.value.id);
    if (isNew) {
      await fetch('/api/accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(accountForm.value)
      });
      newAccountIds.value.delete(accountForm.value.id);
    } else {
      await fetch(`/api/accounts/${accountForm.value.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(accountForm.value)
      });
    }
    const idx = accounts.value.findIndex(a => a.id === accountForm.value.id);
    if (idx !== -1) accounts.value[idx] = { ...accountForm.value };
    editingAccountId.value = null;
    window.dispatchEvent(new Event('accounts-updated'));
  } catch (e) { console.error('Failed to save account', e); }
};

const createAccount = () => {
  const id = crypto.randomUUID();
  const acct: MaxAccount = {
    id, name: 'New Account', googleAdsId: null, facebookAdsId: null, ga4Id: null,
    shopifyId: null, instagramId: null, facebookPageId: null, gscId: null
  };
  newAccountIds.value.add(id);
  accounts.value.push(acct);
  startEditAccount(acct);
};

const deleteAccount = async (id: string) => {
  if (!confirm('Are you sure you want to delete this account?')) return;
  try {
    await fetch(`/api/accounts/${id}`, { method: 'DELETE', credentials: 'include' });
    accounts.value = accounts.value.filter(a => a.id !== id);
    window.dispatchEvent(new Event('accounts-updated'));
  } catch (e) { console.error('Failed to delete account', e); }
};

// --- User CRUD ---
const openCreateUser = () => {
  editingUserId.value = null;
  userForm.value = { name: '', email: '', password: '', role: 'user', accountIds: [] };
  userError.value = '';
  showUserModal.value = true;
};

const openEditUser = (user: AdminUser) => {
  editingUserId.value = user.id;
  userForm.value = {
    name: user.name, email: user.email, password: '',
    role: user.role, accountIds: user.memberships.map(m => m.accountId)
  };
  userError.value = '';
  showUserModal.value = true;
};

const saveUser = async () => {
  userError.value = '';
  try {
    if (editingUserId.value) {
      // Update user
      await fetch(`/api/admin/users/${editingUserId.value}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: userForm.value.name, email: userForm.value.email, role: userForm.value.role })
      });

      // Sync memberships
      const existing = users.value.find(u => u.id === editingUserId.value);
      const existingAccountIds = new Set(existing?.memberships.map(m => m.accountId) || []);
      const desiredAccountIds = new Set(userForm.value.accountIds);

      // Add new memberships
      for (const accountId of desiredAccountIds) {
        if (!existingAccountIds.has(accountId)) {
          await fetch(`/api/admin/users/${editingUserId.value}/memberships`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'include', body: JSON.stringify({ accountId })
          });
        }
      }

      // Remove old memberships
      for (const m of existing?.memberships || []) {
        if (!desiredAccountIds.has(m.accountId)) {
          await fetch(`/api/admin/users/${editingUserId.value}/memberships/${m.id}`, {
            method: 'DELETE', credentials: 'include'
          });
        }
      }
    } else {
      // Create user
      if (!userForm.value.password || userForm.value.password.length < 8) {
        userError.value = 'Password must be at least 8 characters';
        return;
      }
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: userForm.value.name, email: userForm.value.email,
          password: userForm.value.password, role: userForm.value.role,
          accountIds: userForm.value.accountIds
        })
      });
      if (!res.ok) {
        const data = await res.json();
        userError.value = data.error || 'Failed to create user';
        return;
      }
    }

    showUserModal.value = false;
    await loadUsers();
  } catch (e) {
    console.error('Failed to save user', e);
    userError.value = 'An unexpected error occurred';
  }
};

const deleteUser = async (userId: string) => {
  if (!confirm('Are you sure you want to delete this user?')) return;
  try {
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' });
    await loadUsers();
  } catch (e) { console.error('Failed to delete user', e); }
};

const getAccountName = (accountId: string) => {
  const acct = accounts.value.find(a => a.id === accountId);
  return acct?.name || accountId;
};

const toggleAccountAssignment = (accountId: string) => {
  const idx = userForm.value.accountIds.indexOf(accountId);
  if (idx >= 0) {
    userForm.value.accountIds.splice(idx, 1);
  } else {
    userForm.value.accountIds.push(accountId);
  }
};

onMounted(() => {
  loadAccounts();
  loadPlatformAccounts();
  loadUsers();
});
</script>

<template>
  <div class="flex-1 p-8 bg-stone-50 overflow-y-auto h-full animate-in fade-in duration-500">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold text-slate-800 mb-6">Admin</h1>

      <!-- Tab Bar -->
      <div class="flex gap-1 mb-6 bg-stone-200 rounded-xl p-1 w-fit">
        <button
          @click="activeTab = 'accounts'"
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
          :class="activeTab === 'accounts' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <Building2 :size="16" /> Accounts
        </button>
        <button
          @click="activeTab = 'users'"
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
          :class="activeTab === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <Users :size="16" /> Users
        </button>
      </div>

      <!-- ACCOUNTS TAB -->
      <div v-if="activeTab === 'accounts'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-slate-700">All Accounts</h2>
          <button @click="createAccount" class="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus class="w-4 h-4 mr-2" /> Create Account
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden divide-y divide-stone-100">
          <div v-for="account in accounts" :key="account.id" class="p-6 hover:bg-stone-50 transition-colors">
            <!-- Edit Mode -->
            <div v-if="editingAccountId === account.id" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Account Name</label>
                <input v-model="accountForm.name" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1">Google Ads</label>
                  <select v-model="accountForm.googleAdsId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select...</option>
                    <option v-for="g in platformAccounts.google" :key="g.id" :value="g.id">{{ g.name }} ({{ g.id }})</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1">Facebook Ads</label>
                  <select v-model="accountForm.facebookAdsId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select...</option>
                    <option v-for="f in platformAccounts.facebook" :key="f.id" :value="f.id">{{ f.name }} ({{ f.id }})</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1">GA4</label>
                  <select v-model="accountForm.ga4Id" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select...</option>
                    <option v-for="g in platformAccounts.ga4" :key="g.id" :value="g.id">{{ g.name }} ({{ g.id }})</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1">Search Console</label>
                  <select v-model="accountForm.gscId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select...</option>
                    <option v-for="g in platformAccounts.gsc" :key="g.id" :value="g.id">{{ g.name }} ({{ g.id }})</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1">Shopify</label>
                  <select v-model="accountForm.shopifyId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select...</option>
                    <option v-for="s in platformAccounts.shopify" :key="s.id" :value="s.id">{{ s.name }} ({{ s.id }})</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1">Instagram</label>
                  <select v-model="accountForm.instagramId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select...</option>
                    <option v-for="i in platformAccounts.instagram" :key="i.id" :value="i.id">{{ i.name }} ({{ i.id }})</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1">FB Page</label>
                  <select v-model="accountForm.facebookPageId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option :value="null">Select...</option>
                    <option v-for="f in platformAccounts.facebook_organic" :key="f.id" :value="f.id">{{ f.name }} ({{ f.id }})</option>
                  </select>
                </div>
              </div>
              <div class="flex justify-end gap-2 mt-4">
                <button @click="cancelEditAccount" class="px-4 py-2 text-sm text-slate-500 hover:bg-stone-100 rounded-lg font-medium">Cancel</button>
                <button @click="saveAccount" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center shadow-sm">
                  <Save class="w-4 h-4 mr-2" /> Save
                </button>
              </div>
            </div>

            <!-- View Mode -->
            <div v-else class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-slate-800">{{ account.name }}</h3>
                <div class="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                  <span class="flex items-center"><span class="w-2 h-2 rounded-full mr-1" :class="account.googleAdsId ? 'bg-green-500' : 'bg-slate-300'"></span>Google</span>
                  <span class="flex items-center"><span class="w-2 h-2 rounded-full mr-1" :class="account.facebookAdsId ? 'bg-blue-500' : 'bg-slate-300'"></span>Meta</span>
                  <span class="flex items-center"><span class="w-2 h-2 rounded-full mr-1" :class="account.ga4Id ? 'bg-orange-500' : 'bg-slate-300'"></span>GA4</span>
                  <span class="flex items-center"><span class="w-2 h-2 rounded-full mr-1" :class="account.gscId ? 'bg-yellow-500' : 'bg-slate-300'"></span>GSC</span>
                  <span class="flex items-center"><span class="w-2 h-2 rounded-full mr-1" :class="account.shopifyId ? 'bg-emerald-500' : 'bg-slate-300'"></span>Shopify</span>
                  <span class="flex items-center"><span class="w-2 h-2 rounded-full mr-1" :class="account.instagramId ? 'bg-pink-500' : 'bg-slate-300'"></span>Instagram</span>
                  <span class="flex items-center"><span class="w-2 h-2 rounded-full mr-1" :class="account.facebookPageId ? 'bg-blue-800' : 'bg-slate-300'"></span>FB Page</span>
                </div>
              </div>
              <div class="flex gap-2">
                <button @click="startEditAccount(account)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit class="w-4 h-4" /></button>
                <button @click="deleteAccount(account.id)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 class="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          <div v-if="accounts.length === 0" class="p-8 text-center text-slate-400 text-sm">No accounts yet</div>
        </div>
      </div>

      <!-- USERS TAB -->
      <div v-if="activeTab === 'users'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-slate-700">All Users</h2>
          <button @click="openCreateUser" class="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus class="w-4 h-4 mr-2" /> Add User
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-stone-50 border-b border-stone-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th class="text-left px-6 py-3">User</th>
                <th class="text-left px-6 py-3">Role</th>
                <th class="text-left px-6 py-3">Accounts</th>
                <th class="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              <tr v-for="u in users" :key="u.id" class="hover:bg-stone-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="font-bold text-sm text-slate-800">{{ u.name }}</div>
                  <div class="text-xs text-slate-400">{{ u.email }}</div>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    :class="u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-slate-600'"
                  >
                    <Shield v-if="u.role === 'admin'" :size="12" />
                    <UserIcon v-else :size="12" />
                    {{ u.role }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="m in u.memberships" :key="m.id" class="bg-stone-100 text-slate-600 text-xs px-2 py-0.5 rounded-md">
                      {{ getAccountName(m.accountId) }}
                    </span>
                    <span v-if="u.memberships.length === 0 && u.role !== 'admin'" class="text-xs text-slate-400 italic">None</span>
                    <span v-if="u.role === 'admin'" class="text-xs text-indigo-400 italic">All (admin)</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex gap-1 justify-end">
                    <button @click="openEditUser(u)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit class="w-4 h-4" /></button>
                    <button @click="deleteUser(u.id)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 class="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="4" class="p-8 text-center text-slate-400 text-sm">No users yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- User Modal -->
    <Teleport to="body">
      <div v-if="showUserModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" @click.self="showUserModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
            <h3 class="font-bold text-slate-800">{{ editingUserId ? 'Edit User' : 'Add User' }}</h3>
            <button @click="showUserModal = false" class="text-slate-400 hover:text-slate-600"><X :size="20" /></button>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Name</label>
              <input v-model="userForm.name" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Email</label>
              <input v-model="userForm.email" type="email" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div v-if="!editingUserId">
              <label class="block text-xs font-bold text-slate-500 mb-1">Password</label>
              <input v-model="userForm.password" type="password" placeholder="Min 8 characters" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">System Role</label>
              <select v-model="userForm.role" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div v-if="userForm.role !== 'admin'">
              <label class="block text-xs font-bold text-slate-500 mb-2">Account Access</label>
              <div class="space-y-1 max-h-40 overflow-y-auto border border-stone-200 rounded-lg p-2">
                <label
                  v-for="acct in accounts" :key="acct.id"
                  class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    :checked="userForm.accountIds.includes(acct.id)"
                    @change="toggleAccountAssignment(acct.id)"
                    class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {{ acct.name }}
                </label>
                <div v-if="accounts.length === 0" class="text-xs text-slate-400 px-2 py-1">No accounts available</div>
              </div>
            </div>

            <div v-if="userError" class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {{ userError }}
            </div>
          </div>

          <div class="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-2">
            <button @click="showUserModal = false" class="px-4 py-2 text-sm text-slate-500 hover:bg-stone-200 rounded-lg font-medium">Cancel</button>
            <button @click="saveUser" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center shadow-sm">
              <Save class="w-4 h-4 mr-2" /> {{ editingUserId ? 'Save Changes' : 'Create User' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
