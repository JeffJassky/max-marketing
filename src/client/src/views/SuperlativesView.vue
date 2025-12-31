<script setup lang="ts">
import { ref, onMounted, watch, inject, computed, type Ref } from 'vue';
import { Award, Trophy, Medal, Star } from 'lucide-vue-next';

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
}

interface Superlative {
  report_date: string;
  account_id: string;
  time_period: string;
  entity_type: string;
  dimension: string;
  item_name: string;
  item_id: string;
  metric_name: string;
  metric_value: number;
  rank_type: string;
}

const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');
const loading = ref(false);
const superlatives = ref<Superlative[]>([]);
const error = ref<string | null>(null);

const loadSuperlatives = async () => {
  if (!selectedAccount?.value) {
    superlatives.value = [];
    return;
  }

  const { id, googleAdsId, facebookAdsId } = selectedAccount.value;
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    if (id) params.append('accountId', id);
    if (googleAdsId) params.append('googleAdsId', googleAdsId);
    if (facebookAdsId) params.append('facebookAdsId', facebookAdsId);

    const res = await fetch(`/api/reports/superlatives?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch superlatives');

    superlatives.value = await res.json();
  } catch (err: any) {
    console.error(err);
    error.value = err.message || 'Failed to load data';
  } finally {
    loading.value = false;
  }
};

const groupedSuperlatives = computed(() => {
  const groups: Record<string, Superlative[]> = {};
  superlatives.value.forEach(item => {
    if (!groups[item.entity_type]) {
      groups[item.entity_type] = [];
    }
    groups[item.entity_type].push(item);
  });

  // Sort groups by the highest metric value within that group
  return Object.keys(groups)
    .sort((a, b) => {
      const maxA = Math.max(...groups[a].map(i => i.metric_value));
      const maxB = Math.max(...groups[b].map(i => i.metric_value));
      return maxB - maxA;
    })
    .map(key => ({
      entityType: key,
      items: groups[key]
    }));
});
const formatEntityName = (name: string) => {
  if (name.includes('facebook')) return 'Facebook Performance';
  if (name.includes('keyword')) return 'Keyword Performance';
  if (name.includes('pmax')) return 'Performance Max';
  if (name.includes('campaign')) return 'Google Ads Performance';
  return name;
};

const formatDimensionName = (dimension: string) => {
  const map: Record<string, string> = {
    'campaign': 'Campaign',
    'campaign_name': 'Campaign',
    'ad_group_name': 'Ad Group',
    'keyword_info_text': 'Keyword',
    'publisher_platform': 'Platform',
    'platform_position': 'Placement',
    'ad_network_type': 'Network',
    'advertising_channel_type': 'Channel'
  };
  return map[dimension] || 'Item';
};

const formatMetricName = (name: string) => {
  if (name.toLowerCase() === 'roas') return 'ROAS';
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatValue = (metric: string, value: number) => {
  if (metric.toLowerCase() === 'roas') {
    return `${value.toFixed(1)}x`;
  }
  if (metric.includes('spend') || metric.includes('cost') || metric.includes('value') || metric.includes('volume')) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
  return new Intl.NumberFormat('en-US').format(value);
};

const getRankIcon = (index: number) => {
  if (index === 0) return Trophy;
  if (index === 1) return Medal;
  if (index === 2) return Award;
  return Star;
};

const getRankColor = (index: number) => {
  if (index === 0) return 'text-yellow-500 bg-yellow-50';
  if (index === 1) return 'text-slate-400 bg-slate-50';
  if (index === 2) return 'text-amber-600 bg-amber-50';
  return 'text-amplify-purple bg-amplify-purple/5';
};

onMounted(() => {
  if (selectedAccount?.value) loadSuperlatives();
});

watch(() => selectedAccount?.value, () => {
  loadSuperlatives();
});
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
    <section
      class="p-8 font-sans animate-in fade-in duration-500 overflow-y-auto h-full pb-20"
    >
      <!-- Header -->
      <div class="mb-12">
        <h1 class="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Trophy class="text-yellow-500" :size="32" />
          Hall of Fame
        </h1>
        <p class="text-slate-500 mt-2 max-w-2xl">
          Highlighting the top performers across your advertising accounts.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div
          class="w-8 h-8 border-4 border-amplify-purple border-t-transparent rounded-full animate-spin"
        ></div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100"
      >
        {{ error }}
      </div>

      <!-- Empty State -->
      <div
        v-else-if="superlatives.length === 0"
        class="text-center py-20 bg-white rounded-3xl border border-stone-100"
      >
        <Award class="mx-auto text-slate-300 mb-4" :size="48" />
        <h3 class="text-lg font-bold text-slate-700">
          No highlights found yet
        </h3>
        <p class="text-slate-400 mt-1">Check back after your next data sync.</p>
      </div>

      <!-- Grouped Content -->
      <div v-else class="space-y-16">
        <div
          v-for="group in groupedSuperlatives"
          :key="group.entityType"
          class="space-y-8"
        >
          <h2
            class="text-xl font-bold text-slate-800 border-b border-stone-200 pb-3 flex items-center gap-2"
          >
            <span class="w-1.5 h-6 bg-amplify-purple rounded-full"></span>
            {{ formatEntityName(group.entityType) }}
          </h2>

          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <div
              v-for="(item, index) in group.items"
              :key="index"
              class="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col h-full"
            >
              <div class="flex justify-between items-start mb-4">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  :class="getRankColor(index % 4)"
                >
                  <component :is="getRankIcon(index % 4)" :size="20" />
                </div>
              </div>

              <h3 class="text-slate-800 text-lg mb-2 leading-tight">
                The
                <span
                  class="font-semibold text-slate-700"
                  >{{ item.item_name }}</span
                >
                {{ formatDimensionName(item.dimension).toLowerCase() }} had the
                {{ item.rank_type }}
                <span
                  class="font-semibold text-slate-700"
                  >{{ formatMetricName(item.metric_name).toLowerCase() }}</span
                >.
              </h3>

              <div
                class="flex items-end justify-between border-t border-stone-50 pt-4 mt-auto"
              >
                <div
                  class="text-xs text-slate-400 font-medium uppercase tracking-wider"
                >
                  {{ formatMetricName(item.metric_name) }}
                </div>
                <div class="text-xl font-bold text-amplify-purple font-mono">
                  {{ formatValue(item.metric_name, item.metric_value) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
