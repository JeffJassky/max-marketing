<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { KeyRound } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const token = route.query.token as string || '';
const email = route.query.email as string || '';

const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const success = ref(false);
const submitting = ref(false);

const handleReset = async () => {
  error.value = '';

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters';
    return;
  }

  submitting.value = true;
  const result = await authStore.resetPassword(token, email, password.value);
  submitting.value = false;

  if (result.error) {
    error.value = result.error;
  } else {
    success.value = true;
    setTimeout(() => router.push('/login'), 2000);
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-amplify-dark px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-3">
          <div class="w-10 h-10 bg-amplify-green rounded-lg flex items-center justify-center text-amplify-darker font-bold text-2xl relative overflow-hidden">
            <span class="z-10">M</span>
            <div class="absolute top-0 right-0 w-5 h-5 bg-white/30 rounded-bl-lg" />
          </div>
          <div class="text-left">
            <h1 class="text-xl font-bold text-white tracking-tight leading-none">MAXED</h1>
            <p class="text-[10px] text-amplify-green font-mono tracking-widest uppercase">Marketing.OS</p>
          </div>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <template v-if="!success">
          <h2 class="text-xl font-bold text-white mb-1">Set new password</h2>
          <p class="text-sm text-slate-400 mb-6">Enter your new password below.</p>

          <div v-if="!token || !email" class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            Invalid or missing reset link. Please request a new one.
          </div>

          <form v-else @submit.prevent="handleReset" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">New Password</label>
              <input
                v-model="password"
                type="password"
                required
                minlength="8"
                autocomplete="new-password"
                class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <input
                v-model="confirmPassword"
                type="password"
                required
                autocomplete="new-password"
                class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Repeat your password"
              />
            </div>

            <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
              {{ error }}
            </div>

            <button
              type="submit"
              :disabled="submitting"
              class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound :size="18" />
              {{ submitting ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>
        </template>

        <template v-else>
          <div class="text-center py-4">
            <div class="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound :size="28" class="text-green-400" />
            </div>
            <h2 class="text-xl font-bold text-white mb-2">Password reset!</h2>
            <p class="text-sm text-slate-400">Redirecting to sign in...</p>
          </div>
        </template>

        <div class="mt-6 text-center">
          <router-link to="/login" class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Back to sign in
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
