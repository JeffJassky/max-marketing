<script setup lang="ts">
import { ref, onMounted, watch, inject, type Ref, computed } from 'vue';
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Activity,
  Search,
  Ban,
  TrendingDown,
  Layers,
  ArrowRightLeft,
  DollarSign,
  MousePointer2,
  Calendar,
  ChevronRight,
  ShieldAlert,
  BarChart3,
  Percent,
  X,
  Clock,
  Database,
  Info,
  Tag
} from 'lucide-vue-next';
import { useDateRange } from '../composables/useDateRange';

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
  ga4Id: string | null;
}

interface Anomaly {
  monitor_id: string;
  measure_id: string;
  metric: string;
  detected_at: string;
  anomaly_score: number;
  anomaly_impact: number;
  anomaly_message: string;
  dimensions?: Record<string, any>;
  [key: string]: any; // Allow for context metrics and raw fields
}

const anomalies = ref<Anomaly[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedAnomaly = ref<Anomaly | null>(null);

// Global Account State injected from layout
const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');
const { dateParams } = useDateRange();

const fetchAnomalies = async () => {
  if (!selectedAccount?.value) return;
  
  loading.value = true;
  error.value = null;
  anomalies.value = [];

  try {
    const params = new URLSearchParams();
    if (selectedAccount.value.googleAdsId) params.append('googleAdsId', selectedAccount.value.googleAdsId);
    if (selectedAccount.value.facebookAdsId) params.append('facebookAdsId', selectedAccount.value.facebookAdsId);
    if (selectedAccount.value.ga4Id) params.append('ga4Id', selectedAccount.value.ga4Id);
    
    if (dateParams.value.startDate) params.append('startDate', dateParams.value.startDate);
    if (dateParams.value.endDate) params.append('endDate', dateParams.value.endDate);

    if (params.toString() === '') {
        loading.value = false;
        return;
    }

    const response = await fetch(`/api/monitors/anomalies?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch anomalies');
    const results = await response.json();
    anomalies.value = results; 

  } catch (e) {
    console.error(e);
    error.value = "Failed to load monitor anomalies.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (selectedAccount?.value) {
    fetchAnomalies();
  }
});

watch([() => selectedAccount?.value, dateParams], () => {
  fetchAnomalies();
}, { immediate: true });

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatScore = (score: number) => {
  return (score * 100).toFixed(0) + '%';
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatValue = (val: any) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') return val.toLocaleString();
  return val;
};

const getMonitorCategory = (monitorId: string) => {
  if (monitorId.includes('keyword') || monitorId.includes('drift')) return 'Keyword Intel';
  if (monitorId.includes('account_spend') || monitorId.includes('account_conversion')) return 'Account Health';
  if (monitorId.includes('active_')) return 'Campaign Ops';
  return 'System Monitors';
};

const groupedAnomalies = computed(() => {
  const groups: Record<string, Anomaly[]> = {};
  anomalies.value.forEach(a => {
    const category = getMonitorCategory(a.monitor_id);
    if (!groups[category]) groups[category] = [];
    groups[category].push(a);
  });
  return groups;
});

const getMonitorTitle = (id: string) => {
  return id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getMonitorIcon = (id: string) => {
  if (id.includes('drift')) return ArrowRightLeft;
  if (id.includes('wasted')) return Ban;
  if (id.includes('low_roas') || id.includes('high_cpa')) return TrendingDown;
  if (id.includes('spend_anomaly')) return DollarSign;
  if (id.includes('conversion_drop')) return ShieldAlert;
  if (id.includes('active_')) return Layers;
  return Activity;
};

const getSeverityClass = (score: number) => {
  if (score > 0.9) return 'bg-red-50 text-red-700 border-red-100';
  if (score > 0.7) return 'bg-orange-50 text-orange-700 border-orange-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
};

const getIconClass = (score: number) => {
  if (score > 0.9) return 'text-red-500';
  if (score > 0.7) return 'text-orange-500';
  return 'text-amber-500';
};

const openDetails = (anomaly: Anomaly) => {
  selectedAnomaly.value = anomaly;
  document.body.style.overflow = 'hidden';
};

const closeDetails = () => {
  selectedAnomaly.value = null;
  document.body.style.overflow = '';
};

// Filter out internal/system fields for the "Raw Data" view
const getDisplayFields = (anomaly: Anomaly) => {
  const skip = ['monitor_id', 'measure_id', 'metric', 'detected_at', 'anomaly_score', 'anomaly_impact', 'anomaly_message', 'dimensions', 'account_id', 'source_table'];
  return Object.entries(anomaly)
    .filter(([key]) => !skip.includes(key))
    .sort(([a], [b]) => a.localeCompare(b));
};
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
    <section class="p-4 md:p-8 font-sans animate-in fade-in duration-500 overflow-y-auto h-full pb-20">
      
      <div class="max-w-7xl mx-auto">
        <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Activity class="text-indigo-600 w-8 h-8" />
              Monitor Anomalies
            </h1>
            <p class="text-slate-500 mt-1 text-lg">
              Automated insights and anomaly detection across your ad platforms.
            </p>
          </div>
        </div>

        <div v-if="loading" class="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div class="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p class="text-slate-400 font-bold">Scanning for performance anomalies...</p>
        </div>

        <div v-else-if="error" class="p-12 text-center bg-white rounded-3xl border border-red-100 shadow-sm">
          <ShieldAlert class="w-16 h-16 text-red-400 mx-auto mb-4 opacity-50" />
          <h3 class="text-xl font-bold text-slate-800">Connection Issue</h3>
          <p class="text-red-500 font-medium mt-2">{{ error }}</p>
          <button @click="fetchAnomalies" class="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
            Try Again
          </button>
        </div>

        <div v-else-if="anomalies.length === 0" class="p-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div class="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle class="w-12 h-12 text-green-500" />
          </div>
          <h3 class="text-2xl font-bold text-slate-800">All Systems Normal</h3>
          <p class="text-slate-500 text-lg mt-2 max-w-md mx-auto">No anomalies detected in the current lookback period. Your accounts are performing within expected statistical ranges.</p>
        </div>

        <div v-else class="space-y-12">
          <div v-for="(groupAnomalies, category) in groupedAnomalies" :key="category" class="space-y-6">
            <div class="flex items-center gap-4">
              <h2 class="text-xl font-bold text-slate-800 whitespace-nowrap">{{ category }}</h2>
              <div class="h-px bg-slate-200 w-full"></div>
              <span class="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-wider">{{ groupAnomalies.length }} Insights</span>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div v-for="row in groupAnomalies" :key="row.detected_at + row.monitor_id" 
                class="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group overflow-hidden flex flex-col">
                
                <!-- Header -->
                <div class="p-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-start">
                  <div class="flex gap-4">
                    <div class="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                      <component :is="getMonitorIcon(row.monitor_id)" :class="['w-6 h-6', getIconClass(row.anomaly_score)]" />
                    </div>
                    <div>
                      <h3 class="font-bold text-slate-900 text-lg">{{ getMonitorTitle(row.monitor_id) }}</h3>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{{ row.metric }}</span>
                        <span class="text-slate-200 text-xs">•</span>
                        <span class="text-xs text-slate-400 font-medium">{{ formatDate(row.detected_at) }}</span>
                      </div>
                    </div>
                  </div>
                  <div :class="['px-3 py-1.5 rounded-lg border text-sm font-bold flex items-center gap-2 shadow-sm', getSeverityClass(row.anomaly_score)]">
                    <Percent class="w-3.5 h-3.5" />
                    {{ formatScore(row.anomaly_score) }} Confidence
                  </div>
                </div>

                <!-- Body -->
                <div class="p-6 flex-1">
                  <p class="text-slate-700 font-medium leading-relaxed mb-4 text-lg">
                    {{ row.anomaly_message }}
                  </p>

                  <!-- Dimensions Grid (Partial View) -->
                  <div v-if="row.dimensions" class="grid grid-cols-2 gap-3 mb-6">
                    <div v-for="(v, k) in Object.entries(row.dimensions).slice(0, 4)" :key="k" class="bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:bg-indigo-50/30 transition-colors">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{{ v[0].replace(/_/g, ' ') }}</span>
                      <span class="text-sm font-bold text-slate-700 truncate block" :title="String(v[1])">{{ v[1] }}</span>
                    </div>
                  </div>

                  <!-- Impact & Action -->
                  <div class="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                    <div v-if="row.anomaly_impact" class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                        <DollarSign class="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase block leading-none mb-1">Impact Potential</span>
                        <span class="text-sm font-bold text-slate-900">{{ formatCurrency(row.anomaly_impact) }}</span>
                      </div>
                    </div>
                    <div v-else class="flex items-center gap-2">
                       <BarChart3 class="w-5 h-5 text-slate-300" />
                       <span class="text-xs font-bold text-slate-400 uppercase">Statistical Anomaly</span>
                    </div>

                    <button @click="openDetails(row)" class="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors group/btn">
                      View Details
                      <ChevronRight class="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Detail Slide-over -->
    <div v-if="selectedAnomaly" class="fixed inset-0 z-[100] flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" @click="closeDetails"></div>
      
      <!-- Panel -->
      <div class="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <component :is="getMonitorIcon(selectedAnomaly.monitor_id)" :class="['w-6 h-6', getIconClass(selectedAnomaly.anomaly_score)]" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-900">{{ getMonitorTitle(selectedAnomaly.monitor_id) }}</h2>
              <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Clock class="w-3.5 h-3.5" />
                {{ formatDate(selectedAnomaly.detected_at) }}
              </div>
            </div>
          </div>
          <button @click="closeDetails" class="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-8 space-y-10">
          <!-- Severity & Message -->
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div :class="['px-3 py-1.5 rounded-lg border text-sm font-bold flex items-center gap-2', getSeverityClass(selectedAnomaly.anomaly_score)]">
                <Percent class="w-4 h-4" />
                {{ formatScore(selectedAnomaly.anomaly_score) }} Detection Confidence
              </div>
              <div v-if="selectedAnomaly.anomaly_impact" class="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-bold flex items-center gap-2">
                <DollarSign class="w-4 h-4" />
                {{ formatCurrency(selectedAnomaly.anomaly_impact) }} Estimated Impact
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 leading-tight">
              {{ selectedAnomaly.anomaly_message }}
            </p>
          </div>

          <!-- All Dimensions -->
          <div v-if="selectedAnomaly.dimensions" class="space-y-4">
            <div class="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
              <Tag class="w-4 h-4" />
              Categorical Dimensions
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div v-for="(v, k) in selectedAnomaly.dimensions" :key="k" class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{{ k.replace(/_/g, ' ') }}</span>
                <span class="text-sm font-bold text-slate-800 break-words">{{ v }}</span>
              </div>
            </div>
          </div>

          <!-- Context Metrics / Raw Data -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
              <Database class="w-4 h-4" />
              Observed Metrics & Raw Data
            </div>
            <div class="bg-slate-900 rounded-2xl p-6 overflow-hidden">
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <div v-for="[key, val] in getDisplayFields(selectedAnomaly)" :key="key">
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 font-mono">{{ key }}</span>
                    <span class="text-sm font-bold text-indigo-300 font-mono">{{ formatValue(val) }}</span>
                  </div>
               </div>
            </div>
          </div>

          <!-- Technical Notes -->
          <div class="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex gap-4">
            <Info class="w-6 h-6 text-indigo-500 shrink-0" />
            <div>
              <h4 class="text-sm font-bold text-indigo-900 mb-1">About this Anomaly</h4>
              <p class="text-xs text-indigo-700 leading-relaxed">
                This anomaly was detected by the <span class="font-bold">{{ selectedAnomaly.monitor_id }}</span> using the <span class="font-bold">{{ selectedAnomaly.measure_id }}</span> measure. 
                The score of <span class="font-bold">{{ formatScore(selectedAnomaly.anomaly_score) }}</span> indicates how far the observed value deviated from the expected baseline or threshold.
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button class="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
            Mark as Reviewed
          </button>
          <button class="px-6 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-white transition-colors">
            Share
          </button>
        </div>
      </div>
    </div>
  </div>
</template>