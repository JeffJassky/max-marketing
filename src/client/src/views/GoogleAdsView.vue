<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Activity,
  Wallet,
  TrendingDown,
  Target,
  Unlock,
  CheckCircle,
  ArrowRightLeft,
  AlertTriangle,
  Ban,
  PauseCircle,
  Calendar,
  Check,
  ArrowRight
} from 'lucide-vue-next';

type GoogleAdsSubView = 'overview' | 'opportunities' | 'wasteWatch' | 'roadmap';

type LowPerfKeyword = {
  id: string;
  keyword: string;
  spend: string;
  ctr: string;
  qualityScore: string;
};

type SearchTermDrift = {
  id: string;
  campaignName: string;
  goodTerm: { term: string; metricLabel: string; metricValue: string };
  driftingTerm: { term: string; metricLabel: string; metricValue: string };
};

type ActionLog = {
  date: string;
  action: string;
  savings: string;
};

type RoadmapTask = {
  id: string;
  label: string;
  subLabel: string;
  completed: boolean;
  month: number;
};

const activeTab = ref<GoogleAdsSubView>('overview');
const keywordsPaused = ref(false);
const driftFixed = ref(false);

const lowPerfKeywords = ref<LowPerfKeyword[]>([
  { id: 'k1', keyword: 'buy drums online cheap', spend: '$145.20', ctr: '0.8%', qualityScore: '3/10' },
  { id: 'k2', keyword: 'free guitar lessons', spend: '$89.50', ctr: '1.2%', qualityScore: '2/10' },
  { id: 'k3', keyword: 'used amps near me', spend: '$62.10', ctr: '2.1%', qualityScore: '4/10' },
  { id: 'k4', keyword: 'synthesizer repair DIY', spend: '$41.00', ctr: '0.5%', qualityScore: '3/10' },
  { id: 'k5', keyword: 'sheet music pdf free', spend: '$38.75', ctr: '1.1%', qualityScore: '2/10' }
]);

const driftAnalysis = ref<SearchTermDrift>({
  id: 'd1',
  campaignName: 'Guitars - High End',
  goodTerm: {
    term: 'Gibson Les Paul Custom',
    metricLabel: 'Conv. Rate',
    metricValue: '4.5%'
  },
  driftingTerm: {
    term: 'Best Cheap Guitar Under $100',
    metricLabel: 'Bounce Rate',
    metricValue: '95%'
  }
});

const wasteWatchLog = ref<ActionLog[]>([
  { date: 'Oct 12, 2024', action: 'Paused 5 low-performing keywords', savings: '$180.00' },
  { date: 'Oct 10, 2024', action: 'Added negative keyword: "free guitar lessons"', savings: '$120.50' },
  { date: 'Oct 05, 2024', action: 'Adjusted ad schedule to business hours', savings: '$85.00' }
]);

const roadmapTasks = ref<RoadmapTask[]>([
  { id: 't1', label: 'Audit Negative Keywords', subLabel: 'Completed today', completed: true, month: 1 },
  { id: 't2', label: 'Optimize Ad Schedule for Store Hours', subLabel: 'Scheduled for Week 2', completed: false, month: 1 },
  { id: 't3', label: 'Review Geo-Targeting Efficiency', subLabel: 'Scheduled for Week 3', completed: false, month: 1 },
  { id: 't4', label: 'Launch "Local Inventory" Ads', subLabel: 'Requires Merchant Center Link', completed: false, month: 2 },
  { id: 't5', label: 'Competitor Conquesting Campaign', subLabel: 'Targeting "Guitar Center" terms', completed: false, month: 2 }
]);

const tabs = computed(() => [
  { id: 'overview', label: 'Overview' },
  { id: 'opportunities', label: 'Opportunities', count: 2 },
  { id: 'wasteWatch', label: 'Waste Watch', count: wasteWatchLog.value.length, locked: wasteWatchLog.value.length === 0 },
  { id: 'roadmap', label: 'Roadmap' }
]);

const handlePauseKeywords = () => {
  keywordsPaused.value = true;
  setTimeout(() => {
    keywordsPaused.value = false;
  }, 2000);
};

const handleFixDrift = () => {
  driftFixed.value = true;
  setTimeout(() => {
    driftFixed.value = false;
  }, 2000);
};

const toggleRoadmapTask = (taskId: string) => {
  roadmapTasks.value = roadmapTasks.value.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
};
</script>

<template>
  <div class="h-full flex flex-col bg-white min-h-screen">
    <div class="bg-white border-b border-slate-200 pt-8 pb-0 px-4 md:px-8 sticky top-0 z-30">
      <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Google Ads Suite</h1>
          <p class="text-slate-500 text-sm">Campaign Optimization &amp; Management</p>
        </div>
        <div class="flex items-center space-x-3">
          <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200 flex items-center">
            <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse" />
            Active
          </span>
        </div>
      </div>

      <div class="flex space-x-8 overflow-x-auto no-scrollbar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :disabled="tab.locked"
          @click="!tab.locked && (activeTab = tab.id as GoogleAdsSubView)"
          :class="[
            'pb-4 text-sm font-medium border-b-2 transition-colors relative flex items-center whitespace-nowrap',
            activeTab === tab.id
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
            tab.locked ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        >
          {{ tab.label }}
          <Unlock v-if="tab.locked" class="w-3 h-3 ml-2 text-slate-400" />
          <span
            v-else-if="tab.count !== undefined"
            :class="[
              'ml-2 px-1.5 py-0.5 rounded-full text-[10px]',
              activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
            ]"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>
    </div>

    <div class="flex-1 bg-slate-50 p-4 md:p-8 overflow-y-auto">
      <div v-if="activeTab === 'overview'" class="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Account Health Check</h2>
          <p class="text-slate-500 text-sm">Real-time performance snapshot for George's Music.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="text-slate-500 text-sm font-medium">Account Health Score</span>
              <Activity class="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div class="text-3xl font-bold text-slate-900">72<span class="text-lg text-slate-400 font-normal">/100</span></div>
              <div class="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
                <div class="bg-orange-500 h-full rounded-full" style="width: 72%" />
              </div>
            </div>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="text-slate-500 text-sm font-medium">Budget Pacing</span>
              <Wallet class="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div class="text-xl font-bold text-slate-900">On Track</div>
              <div class="text-xs text-slate-500 mt-1">Spending $2,405 of $3,000</div>
            </div>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="text-slate-500 text-sm font-medium">Lifetime Waste</span>
              <TrendingDown class="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-900">$2,500</div>
              <div class="text-xs text-red-500 mt-1 font-medium">Requires Optimization</div>
            </div>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="text-slate-500 text-sm font-medium">Actionable Opportunities</span>
              <Target class="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div class="text-3xl font-bold text-slate-900">2</div>
              <div class="text-xs text-slate-500 mt-1">Pending Actions</div>
            </div>
          </div>
        </div>

        <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-indigo-900">Ready to optimize?</h3>
            <p class="text-indigo-700 mt-1">You have pending opportunities that could save budget immediately.</p>
          </div>
          <button
            class="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-colors whitespace-nowrap"
            @click="activeTab = 'opportunities'"
          >
            View Opportunities
          </button>
        </div>
      </div>

      <div v-else-if="activeTab === 'opportunities'" class="max-w-4xl mx-auto space-y-8 pb-12">
        <div class="mb-2">
          <h2 class="text-lg font-bold text-slate-900">High Priority Suggestions</h2>
          <p class="text-slate-500 text-sm">Actionable insights to improve ROAS immediately.</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-orange-100 rounded-lg">
                <TrendingDown class="w-5 h-5 text-orange-600" />
              </div>
              <h3 class="text-lg font-bold text-slate-900">Low-Performing Keywords</h3>
            </div>
            <span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-semibold">Low Quality Score</span>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Keyword</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Spend</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">CTR</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quality Score</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-slate-100">
                <tr v-for="keyword in lowPerfKeywords" :key="keyword.id">
                  <td class="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{{ keyword.keyword }}</td>
                  <td class="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{{ keyword.spend }}</td>
                  <td class="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{{ keyword.ctr }}</td>
                  <td class="px-6 py-3 whitespace-nowrap text-sm text-red-500 font-semibold">{{ keyword.qualityScore }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <div v-if="keywordsPaused" class="flex items-center text-green-600 font-bold px-4 py-2">
              <CheckCircle class="w-5 h-5 mr-2" />
              Keywords Paused
            </div>
            <button
              v-else
              class="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              @click="handlePauseKeywords"
            >
              <PauseCircle class="w-4 h-4 mr-2" />
              Pause These Keywords
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-blue-100 rounded-lg">
                <ArrowRightLeft class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">Search Term Drift Detected</h3>
                <p class="text-xs text-slate-500">Campaign: {{ driftAnalysis.campaignName }}</p>
              </div>
            </div>
            <span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">Intent Mismatch</span>
          </div>

          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border border-green-200 bg-green-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-green-700 uppercase">Target Intent</span>
                <CheckCircle class="w-4 h-4 text-green-500" />
              </div>
              <p class="text-lg font-bold text-slate-900 mb-1">{{ driftAnalysis.goodTerm.term }}</p>
              <div class="flex items-center text-sm text-slate-600">
                <span class="font-semibold mr-2">{{ driftAnalysis.goodTerm.metricLabel }}:</span>
                {{ driftAnalysis.goodTerm.metricValue }}
              </div>
            </div>

            <div class="border border-red-200 bg-red-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-red-700 uppercase">Drift Detected</span>
                <AlertTriangle class="w-4 h-4 text-red-500" />
              </div>
              <p class="text-lg font-bold text-slate-900 mb-1">{{ driftAnalysis.driftingTerm.term }}</p>
              <div class="flex items-center text-sm text-slate-600">
                <span class="font-semibold mr-2">{{ driftAnalysis.driftingTerm.metricLabel }}:</span>
                {{ driftAnalysis.driftingTerm.metricValue }}
              </div>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <div v-if="driftFixed" class="flex items-center text-green-600 font-bold px-4 py-2">
              <CheckCircle class="w-5 h-5 mr-2" />
              Added to Negative List
            </div>
            <button
              v-else
              class="flex items-center px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
              @click="handleFixDrift"
            >
              <Ban class="w-4 h-4 mr-2" />
              Add to Negative List
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'wasteWatch'" class="max-w-4xl mx-auto space-y-6">
        <div class="flex justify-between items-end">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Waste Watch Log</h2>
            <p class="text-slate-500 text-sm">Tracked actions that saved you money.</p>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold text-slate-400 uppercase">Actions Taken This Month</span>
            <div class="text-2xl font-bold text-green-600">$420.50<span class="text-sm text-slate-400 font-normal">/mo</span></div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action Taken</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Est. Savings</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200">
              <tr v-for="(log, idx) in wasteWatchLog" :key="idx">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{{ log.date }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center">
                  <CheckCircle class="w-4 h-4 text-green-500 mr-2" />
                  {{ log.action }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold text-right">{{ log.savings }}</td>
              </tr>
              <tr v-if="wasteWatchLog.length === 0">
                <td class="px-6 py-10 text-center text-slate-400 italic" colspan="3">No actions taken yet this month.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="activeTab === 'roadmap'" class="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Optimization Roadmap</h2>
          <p class="text-slate-500 text-sm">Your guided plan for the next 8 weeks.</p>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <h3 class="text-lg font-bold text-slate-900 flex items-center mb-4">
              <Calendar class="w-5 h-5 text-indigo-500 mr-2" />
              Month 1: Quick Wins
            </h3>
            <div class="space-y-3">
              <div
                v-for="task in roadmapTasks.filter((t) => t.month === 1)"
                :key="task.id"
                class="flex items-start cursor-pointer hover:bg-slate-50 p-2 rounded-lg -ml-2 transition-colors"
                @click="toggleRoadmapTask(task.id)"
              >
                <div
                  :class="[
                    'mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all',
                    task.completed ? 'bg-green-100 border-green-200 text-green-600' : 'bg-white border-slate-300'
                  ]"
                >
                  <Check v-if="task.completed" class="w-3 h-3" />
                </div>
                <div :class="task.completed ? 'opacity-50 transition-opacity' : ''">
                  <p :class="['text-sm font-medium', task.completed ? 'text-slate-500 line-through' : 'text-slate-800']">
                    {{ task.label }}
                  </p>
                  <p class="text-xs text-slate-500">{{ task.subLabel }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 class="text-lg font-bold text-slate-900 flex items-center mb-4">
              <ArrowRight class="w-5 h-5 text-slate-400 mr-2" />
              Month 2: Strategic Initiatives
            </h3>
            <div class="space-y-3">
              <div
                v-for="task in roadmapTasks.filter((t) => t.month === 2)"
                :key="task.id"
                class="flex items-start cursor-pointer hover:bg-slate-100 p-2 rounded-lg -ml-2 transition-colors"
                @click="toggleRoadmapTask(task.id)"
              >
                <div
                  :class="[
                    'mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all',
                    task.completed ? 'bg-green-100 border-green-200 text-green-600' : 'bg-white border-slate-300'
                  ]"
                >
                  <Check v-if="task.completed" class="w-3 h-3" />
                </div>
                <div :class="task.completed ? 'opacity-50 transition-opacity' : ''">
                  <p :class="['text-sm font-medium', task.completed ? 'text-slate-500 line-through' : 'text-slate-600']">
                    {{ task.label }}
                  </p>
                  <p class="text-xs text-slate-400">{{ task.subLabel }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
