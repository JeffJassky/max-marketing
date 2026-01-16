<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  accent?: string;
}>();
</script>

<template>
  <div class="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 text-white shadow-2xl">
    <div class="relative z-10 max-w-3xl">
      <h1 class="mb-6 text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">
        {{ title }}
      </h1>
      <p class="text-xl font-medium text-slate-400 max-w-xl leading-relaxed">
        {{ subtitle }}
      </p>
    </div>
    
    <!-- Abstract Background Decor -->
    <div class="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-[100px]"></div>
    <div class="absolute -bottom-20 right-20 h-64 w-64 rounded-full bg-amplify-purple/20 blur-[80px]"></div>
  </div>
</template>
