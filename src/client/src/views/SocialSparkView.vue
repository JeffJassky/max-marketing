<script setup lang="ts">
import { Sparkles, Lightbulb, ArrowUpRight, Zap } from 'lucide-vue-next';
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center p-8 bg-stone-50 font-sans animate-in fade-in duration-500">
    <div class="max-w-2xl w-full">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-white rounded-2xl shadow-sm border border-stone-100 mx-auto flex items-center justify-center text-amplify-purple mb-6">
          <Sparkles :size="32" />
        </div>
        <h1 class="text-4xl font-bold text-slate-800 mb-3">Spark your next big idea.</h1>
        <p class="text-slate-500 text-lg">What specific product or event do you want to post about?</p>
      </div>

      <div class="bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-stone-100">
        <textarea
          class="w-full h-32 p-6 rounded-[1.5rem] bg-stone-50 border-none outline-none resize-none text-slate-700 placeholder-slate-400 text-lg focus:bg-white focus:ring-2 focus:ring-amplify-purple/20 transition-all"
          placeholder="e.g. A summer sale for our new organic coffee blend..."
        />
        <div class="flex justify-between items-center px-4 pb-2 pt-2">
          <button class="p-2 text-slate-400 hover:text-amplify-purple transition-colors">
            <Lightbulb :size="20" />
          </button>
          <button class="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-amplify-purple hover:shadow-lg hover:shadow-amplify-purple/20 transition-all flex items-center gap-2">
            Generate Ideas <ArrowUpRight :size="16" />
          </button>
        </div>
      </div>

      <div class="mt-8 flex justify-center gap-4">
        <span class="px-4 py-1 bg-white border border-stone-200 rounded-full text-xs font-bold text-slate-500 cursor-pointer hover:border-amplify-green hover:text-slate-800 transition-colors">New Arrival</span>
        <span class="px-4 py-1 bg-white border border-stone-200 rounded-full text-xs font-bold text-slate-500 cursor-pointer hover:border-amplify-green hover:text-slate-800 transition-colors">Flash Sale</span>
        <span class="px-4 py-1 bg-white border border-stone-200 rounded-full text-xs font-bold text-slate-500 cursor-pointer hover:border-amplify-green hover:text-slate-800 transition-colors">Event</span>
      </div>
    </div>
  </div>
</template>
