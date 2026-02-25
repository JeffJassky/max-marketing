import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';
import App from './App.vue';
import { routes } from './router';
import './main.css';

const router = createRouter({
  history: createWebHistory(),
  routes
});

createApp(App)
  .use(createPinia())
  .use(FloatingVue)
  .use(router)
  .mount('#app');
