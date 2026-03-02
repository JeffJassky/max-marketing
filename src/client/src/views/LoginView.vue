<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { LogIn } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);

const handleLogin = async () => {
  error.value = '';
  submitting.value = true;

  const result = await authStore.login(email.value, password.value);
  submitting.value = false;

  if (result.error) {
    error.value = result.error;
  } else {
    router.push('/');
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

      <!-- Login Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h2 class="text-xl font-bold text-white mb-1">Welcome back</h2>
        <p class="text-sm text-slate-400 mb-6">Sign in to your account</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter your password"
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
            <LogIn :size="18" />
            {{ submitting ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <router-link to="/forgot-password" class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Forgot your password?
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
