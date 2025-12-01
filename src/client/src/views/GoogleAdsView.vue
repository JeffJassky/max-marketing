<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Zap } from 'lucide-vue-next';

const tabs = ['Overview', 'Opportunities', 'Waste Watch', 'Roadmap'];
const activeTab = ref('Overview');
const router = useRouter();
</script>

<template>
  <div class="p-8 font-sans h-full flex flex-col">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Campaign Management</h1>
        <p class="text-slate-500 mt-1">Manage and optimize your Google Ads performance.</p>
      </div>
      <button class="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-colors">
        Create Campaign
      </button>
    </div>

    <div class="flex flex-wrap gap-3 mb-8 filter drop-shadow-sm">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="relative h-14 pl-8 pr-12 flex items-center transition-all duration-300 group cursor-pointer"
        :class="activeTab === tab ? 'bg-amplify-purple text-white z-10' : 'bg-white text-slate-500 hover:text-slate-800 hover:bg-stone-50'"
        :style="{ clipPath: 'polygon(0% 0%, calc(100% - 16px) 0%, 100% 50%, calc(100% - 16px) 100%, 0% 100%)' }"
      >
        <span class="text-base font-bold tracking-tight" :class="activeTab === tab ? 'text-white' : ''">{{ tab }}</span>
        <span v-if="tab === 'Opportunities'" class="absolute top-3 right-8 flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="activeTab === tab ? 'bg-amplify-green' : 'bg-amplify-purple'" />
          <span class="relative inline-flex rounded-full h-3 w-3" :class="activeTab === tab ? 'bg-amplify-green' : 'bg-amplify-purple'" />
        </span>
      </button>
    </div>

    <div class="bg-white rounded-[2rem] border border-stone-100 shadow-sm flex-1 p-8 overflow-y-auto">
      <div class="max-w-4xl">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-full bg-amplify-purple/10 flex items-center justify-center text-amplify-purple">
            <Zap :size="24" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-800">2 High Priority Opportunities</h3>
            <p class="text-slate-500 text-sm">Actioning these could save you <span class="text-green-600 font-bold">$420/mo</span>.</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="border border-stone-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100">WASTE DETECTED</span>
                  <span class="text-slate-400 text-xs">Google Ads</span>
                </div>
                <h4 class="font-bold text-lg text-slate-800">Negative Keyword Suggestion</h4>
                <p class="text-slate-500 text-sm mt-1 max-w-xl">The term "free guitars" is driving traffic with 95% bounce rate. Add as negative keyword?</p>
                <div class="flex items-center gap-3 mt-4">
                  <button class="bg-amplify-purple text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-amplify-purple/90">
                    Apply Now <Zap :size="14" />
                  </button>
                  <button class="text-slate-500 text-xs font-bold">View query report</button>
                </div>
              </div>
              <div class="text-right">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Potential</div>
                <div class="text-lg font-bold text-green-600">+$420/mo</div>
              </div>
            </div>
          </div>

          <div class="border border-stone-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="bg-yellow-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-100">IMPROVEMENT</span>
                  <span class="text-slate-400 text-xs">Bidding</span>
                </div>
                <h4 class="font-bold text-lg text-slate-800">Smart Bidding Calibration</h4>
                <p class="text-slate-500 text-sm mt-1 max-w-xl">Shift 15% more budget to the top 3 converting ad groups to improve CPA stability.</p>
              </div>
              <div class="text-right">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Confidence</div>
                <div class="text-lg font-bold text-slate-700">92%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
