import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';
import App from './App.vue';
import { routes } from './router';
import { useAuthStore } from './stores/auth';
import './main.css';

const pinia = createPinia();

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia);
  if (!auth.initialized) await auth.checkAuth();

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login' };
  }
  if (to.meta.public && auth.isAuthenticated) {
    return { name: 'dashboard' };
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'dashboard' };
  }
});

createApp(App)
  .use(pinia)
  .use(FloatingVue)
  .use(router)
  .mount('#app');
