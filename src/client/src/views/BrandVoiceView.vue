<script setup lang="ts">
import { MessageSquare } from 'lucide-vue-next';
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center p-8 bg-stone-50 animate-in fade-in duration-500 text-center">
    <div class="w-20 h-20 bg-white rounded-[2rem] shadow-sm border border-stone-100 flex items-center justify-center text-amplify-purple mb-6">
      <MessageSquare :size="40" />
    </div>
    <h1 class="text-4xl font-bold text-slate-800 mb-4">Brand Voice Tracker</h1>
    <p class="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
      We're building a dedicated space to track, analyze, and perfect your brand's voice across every channel.
    </p>
    <div class="mt-8 px-4 py-2 bg-amplify-purple/10 text-amplify-purple rounded-full text-sm font-bold">
      Coming Soon
    </div>
  </div>
</template>
