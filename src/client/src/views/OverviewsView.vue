<script setup lang="ts">
import { ref, watch, inject, type Ref, onMounted, onUnmounted, nextTick } from 'vue';
import {
  Layout,
  BarChart3,
  Globe,
  ShoppingBag,
  Instagram,
  Facebook,
  RefreshCw,
  Wallet,
  Search,
  Info,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-vue-next';
import Sparkline from '../components/Sparkline.vue';
import { useDateRange } from '../composables/useDateRange';
import { computed } from 'vue';

interface MaxAccount {
  id: string;
  name: string;
  googleAdsId: string | null;
  facebookAdsId: string | null;
  ga4Id: string | null;
  shopifyId: string | null;
  instagramId: string | null;
  facebookPageId: string | null;
  gscId: string | null;
}

const selectedAccount = inject<Ref<MaxAccount | null>>('selectedAccount');
const { dateParams } = useDateRange();

const PlatformTab = {
  GOOGLE: 'GOOGLE',
  META: 'META',
  GA4: 'GA4',
  SHOPIFY: 'SHOPIFY',
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK_ORGANIC: 'FACEBOOK_ORGANIC',
  GSC: 'GSC'
} as const;

type PlatformTab = typeof PlatformTab[keyof typeof PlatformTab];

const tabs = [
  { id: PlatformTab.GOOGLE, label: 'Google Ads', icon: BarChart3, reportId: 'googleAdsCampaignPerformance' },
  { id: PlatformTab.META, label: 'Meta Ads', icon: Facebook, reportId: 'metaAdsCampaignPerformance' },
  { id: PlatformTab.GA4, label: 'Google Analytics', icon: Globe, reportId: 'ga4AcquisitionPerformance' },
  { id: PlatformTab.SHOPIFY, label: 'Shopify', icon: ShoppingBag, reportId: 'shopifySourcePerformance' },
  { id: PlatformTab.INSTAGRAM, label: 'Instagram', icon: Instagram, reportId: 'instagramPostPerformance' },
  { id: PlatformTab.FACEBOOK_ORGANIC, label: 'Facebook', icon: Facebook, reportId: 'facebookPostPerformance' },
  { id: PlatformTab.GSC, label: 'Search Console', icon: Search, reportId: 'gscQueryPerformance' }
];

// Tooltip descriptions by platform and metric (aligned with spec)
const metricTooltips: Record<PlatformTab, Record<string, string>> = {
  [PlatformTab.GOOGLE]: {
    // Spec: Overview: Google Ads - Row 1: Performance Cards
    spend: "Total amount billed by Google for your search, display, and video ads. This represents your raw investment into capturing search intent.",
    impressions: "Visibility count. This shows how many times your brand appeared in front of potential customers, regardless of whether they clicked.",
    clicks: "Total traffic generated. This measures the number of users who found your ad compelling enough to take the first step toward your site.",
    conversions: "Success count. This tracks the total number of users who completed a high-value action, such as a purchase, after clicking your Google ad.",
    conversions_value: "The total dollar value of all conversion actions tracked by Google Ads. Note: this includes all conversion types (purchases, leads, signups, etc.), not just sales revenue.",
    roas: "Return on Ad Spend. For every dollar spent, this shows how much revenue was generated. Higher is better.",
    cpa: "Cost Per Acquisition. The average cost to acquire one conversion. Lower is typically better.",
    ctr: "Click-Through Rate. The percentage of impressions that resulted in a click. Indicates ad relevance and appeal."
  },
  [PlatformTab.META]: {
    // Spec: Overview: Meta Ads - Row 1: Performance Cards
    spend: "Total ad spend on Meta platforms. This covers everything from boosted posts to high-conversion Instagram Story ads.",
    impressions: "Total exposure. This measures the scale of your 'interruption' marketing, showing how many times your creative appeared in user feeds.",
    clicks: "Engagement volume. This represents the number of users who stopped scrolling and clicked to learn more about your brand.",
    conversions: "Total results. These are the specific outcomes—like sales or leads—that Meta identifies as coming directly from your social ads.",
    conversions_value: "Revenue from purchase events tracked by the Meta Pixel. This is filtered to purchase-type conversions only (via action_values), so it represents actual sales revenue, not general conversion value.",
    roas: "Return on Ad Spend for Meta. Shows revenue generated per dollar spent on Facebook and Instagram ads.",
    cpa: "Cost Per Acquisition on Meta. Average spend required to generate one conversion.",
    ctr: "Click-Through Rate. Percentage of people who clicked after seeing your ad. Reflects creative and targeting effectiveness.",
    reach: "Unique users who saw your ad at least once. Indicates the breadth of your audience exposure."
  },
  [PlatformTab.GA4]: {
    // Spec: Overview: Google Analytics (GA4) - Row 1: Site Engagement Cards
    sessions: "Total visits to your site. A session starts when a user arrives and ends after 30 minutes of inactivity.",
    engaged_sessions: "Sessions where users spent 10+ seconds, had 2+ page views, or completed a conversion. Quality engagement indicator.",
    conversions: "The total number of high-value actions taken on your site. This includes purchases and other 'milestone' actions like adding an item to the cart.",
    revenue: "Total purchase revenue tracked by Google Analytics. May differ from Shopify due to attribution methodology.",
    engagement_rate: "This measures traffic quality. A high engagement rate means your visitors are actually interacting with your content rather than leaving immediately.",
    conversion_rate: "The percentage of sessions that resulted in a conversion. Higher rates indicate more effective traffic and site experience.",
    // Spec-required metrics
    avg_engagement_time: "The average time a user spends actively looking at your site. For high-ticket items, longer times often indicate higher purchase intent.",
    events_per_user: "This shows how 'busy' your users are. More events per user generally mean they are exploring multiple products or reading deep into your content.",
    active_users: "The number of distinct users who visited your site during this period.",
    event_count: "Total number of events triggered across all users and sessions.",
    user_engagement_duration: "The total amount of time your website was actively in users' foreground across all sessions."
  },
  [PlatformTab.SHOPIFY]: {
    // Shopify performance metrics
    revenue: "Total gross sales from your Shopify store. The source of truth for actual business revenue.",
    orders: "Total number of completed orders. Direct measure of purchase volume.",
    tax: "Total tax collected on orders. Useful for financial reconciliation.",
    discounts: "Total value of discounts applied. Helps track promotion effectiveness.",
    refunds: "Total refund amounts processed. Monitor for potential product or service issues.",
    aov: "Average Order Value. Revenue divided by orders. Higher AOV often indicates successful upselling."
  },
  [PlatformTab.INSTAGRAM]: {
    // Social media organic performance
    impressions: "Total times your organic posts were displayed to users across social platforms.",
    reach: "Unique accounts that saw your content. Measures audience breadth.",
    engagement: "Total interactions including likes, comments, shares, and saves.",
    followers: "Total follower count across connected social accounts.",
    engagement_rate: "Engagement divided by reach. Indicates how compelling your content is to your audience.",
    posts: "Number of posts published during this period."
  },
  [PlatformTab.FACEBOOK_ORGANIC]: {
    // Social media organic performance
    impressions: "Total times your organic posts were displayed to users across social platforms.",
    reach: "Unique accounts that saw your content. Measures audience breadth.",
    engagement: "Total interactions including likes, comments, shares, and saves.",
    followers: "Total follower count across connected social accounts.",
    engagement_rate: "Engagement divided by reach. Indicates how compelling your content is to your audience.",
    posts: "Number of posts published during this period."
  },
  [PlatformTab.GSC]: {
    // Spec: Overview: Search Console - Row 1: Organic Health Cards
    clicks: "Total organic traffic. This is the volume of visitors coming to your site for free from Google search results.",
    impressions: "Organic visibility. This measures how often Google shows your brand to people searching for related keywords.",
    ctr: "Search relevance. A higher CTR means your website's title and description are highly relevant to what people are searching for.",
    position: "Search rank. This is your average 'seat' on the Google results page. The closer this number is to 1, the higher you appear at the top of the page."
  }
};

// Get tooltip for a metric based on active platform
const getMetricTooltip = (metricKey: string): string => {
  const platformTooltips = metricTooltips[activeTab.value];
  return platformTooltips?.[metricKey] || `${metricKey.replace(/_/g, ' ')} for the selected period.`;
};

const activeTab = ref<PlatformTab>(PlatformTab.GOOGLE);
const loading = ref(false);
const error = ref<string | null>(null);

interface ReportHeader {
  key: string;
  label: string;
  type: 'dimension' | 'metric' | 'rate' | 'sparkline';
  metric?: string; // For sparkline column
}

interface ReportData {
  headers: ReportHeader[];
  rows: any[];
  totals: Record<string, number>;
  dailyTotals: Record<string, number[]>;
}

const reportData = ref<ReportData>({ headers: [], rows: [], totals: {}, dailyTotals: {} });

// Sorting State
const sortKey = ref<string | null>(null);
const sortOrder = ref<'asc' | 'desc'>('desc');

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'desc';
  }
};

const sortedRows = computed(() => {
  if (!sortKey.value) return reportData.value.rows;

  return [...reportData.value.rows].sort((a, b) => {
    let aVal = a[sortKey.value!];
    let bVal = b[sortKey.value!];

    // Handle nulls/undefined
    if (aVal === null || aVal === undefined) return sortOrder.value === 'asc' ? -1 : 1;
    if (bVal === null || bVal === undefined) return sortOrder.value === 'asc' ? 1 : -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder.value === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal;
  });
});

const loadReport = async () => {
  if (!selectedAccount?.value) return;

  const currentTab = tabs.find(t => t.id === activeTab.value);
  if (!currentTab) return;

  loading.value = true;
  error.value = null;
  // Reset sorting when tab changes
  sortKey.value = null;
  sortOrder.value = 'desc';
  reportData.value = { headers: [], rows: [], totals: {}, dailyTotals: {} };

  try {
    const params = new URLSearchParams();

    // Account Params
    const acc = selectedAccount.value;
    if (acc.id) params.append('accountId', acc.id);
    if (acc.googleAdsId) params.append('googleAdsId', acc.googleAdsId);
    if (acc.facebookAdsId) params.append('facebookAdsId', acc.facebookAdsId);
    if (acc.ga4Id) params.append('ga4Id', acc.ga4Id);
    if (acc.shopifyId) params.append('shopifyId', acc.shopifyId);
    if (acc.instagramId) params.append('instagramId', acc.instagramId);
    if (acc.facebookPageId) params.append('facebookPageId', acc.facebookPageId);
    if (acc.gscId) params.append('gscId', acc.gscId);

    // Query Params
    params.append('start', dateParams.value.startDate || '');
    params.append('end', dateParams.value.endDate || '');
    params.append('grain', 'daily');

    const res = await fetch(`/api/reports/${currentTab.reportId}/live?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load report');

    const data = await res.json();
    // Handle both array (legacy fallback) and object formats
    if (Array.isArray(data)) {
        // Fallback or empty state
        reportData.value = { headers: [], rows: [], totals: {}, dailyTotals: {} };
    } else {
        reportData.value = data;
    }
  } catch (err) {
    console.error(err);
    error.value = 'Failed to load report data.';
  } finally {
    loading.value = false;
  }
};

const formatValue = (key: string, value: any) => {
  if (typeof value === 'number') {
    if (key.includes('rate') || key.includes('ctr') || key.includes('roas')) {
      return key.includes('roas') ? `${value.toFixed(2)}x` : `${(value * 100).toFixed(1)}%`;
    }
    if (key.includes('spend') || key.includes('revenue') || key.includes('cpa') || key.includes('aov') || key.includes('value')) {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return value.toLocaleString();
  }
  return value;
};

// Calculate Cumulative Sum for Summary Cards
const getCumulativeTotal = (key: string) => {
  const dailyValues = reportData.value.dailyTotals[key];
  if (!dailyValues) return [];

  const cumulative: number[] = [];
  let runningSum = 0;
  dailyValues.forEach(val => {
    runningSum += val;
    cumulative.push(runningSum);
  });
  return cumulative;
};

// Get Sparkline Data for Table Row (Daily Trend)
const getSparklineData = (row: any, metricKey?: string) => {
  if (!row._daily || !row._daily.length) return [];
  if (metricKey) {
      return row._daily.map((d: any) => d[metricKey] || 0);
  }
  return [];
};

watch([() => activeTab.value, () => selectedAccount?.value, dateParams], () => {
  loadReport();
}, { immediate: true });

// Sticky thead via JS transform (CSS sticky won't work through overflow-x-auto)
const scrollContainerRef = ref<HTMLElement | null>(null);
const theadRef = ref<HTMLElement | null>(null);
const stickyOffset = ref(0);
const isTheadStuck = ref(false);

const handleStickyScroll = () => {
  const container = scrollContainerRef.value;
  const thead = theadRef.value;
  if (!container || !thead) return;

  const table = thead.closest('table');
  if (!table) return;

  const containerTop = container.getBoundingClientRect().top;
  const theadRect = thead.getBoundingClientRect();
  const tableRect = table.getBoundingClientRect();
  const theadHeight = thead.offsetHeight;

  // Natural top = where the thead would be without our transform
  const naturalTop = theadRect.top - stickyOffset.value;

  // Stick when thead scrolls above the container, stop when table bottom reaches
  if (naturalTop < containerTop && tableRect.bottom > containerTop + theadHeight) {
    stickyOffset.value = containerTop - naturalTop;
    isTheadStuck.value = true;
  } else {
    stickyOffset.value = 0;
    isTheadStuck.value = false;
  }
};

onMounted(() => {
  nextTick(() => {
    scrollContainerRef.value?.addEventListener('scroll', handleStickyScroll, { passive: true });
  });
});

onUnmounted(() => {
  scrollContainerRef.value?.removeEventListener('scroll', handleStickyScroll);
});
</script>

<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- Header -->
    <div
      class="bg-white border-b border-slate-200 pt-6 px-4 md:px-8 sticky top-0 z-20 shadow-sm"
    >
      <div
        class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center">
            <Layout class="w-8 h-8 mr-3 text-indigo-600" />
            Platform Overviews
          </h1>
          <p class="text-slate-500 text-sm mt-1">
            Unified performance metrics for your channels.
          </p>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <button
            @click="loadReport"
            class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw :class="{'animate-spin': loading}" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex space-x-1 overflow-x-auto no-scrollbar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap min-w-[120px] justify-center"
          :class="activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'"
        >
          <component
            :is="tab.icon"
            class="w-4 h-4 mr-2"
            :class="activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'"
          />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div ref="scrollContainerRef" class="flex-1 overflow-y-auto">
      <div v-if="loading" class="py-4 md:py-8">
        <RefreshCw class="w-8 h-8 mb-2 animate-spin text-indigo-300" />
        <p>Loading report data...</p>
      </div>

      <div v-else-if="error" class="py-4 md:py-8">
        <p>{{ error }}</p>
        <button
          @click="loadReport"
          class="mt-4 px-4 py-2 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
        >
          Retry
        </button>
      </div>

      <div v-else-if="!reportData.rows.length" class="py-4 md:py-8">
        <BarChart3 class="w-12 h-12 mb-2 text-slate-200" />
        <p>No data available for this period.</p>
        <p class="text-xs mt-1">
          Try selecting a different date range or account.
        </p>
      </div>

      <div v-else>
        <div class="py-4 md:py-8">
          <!-- Summary Cards (Top Row) -->
          <div
            class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 px-4 md:px-8"
          >
            <!-- Pick top 4 numeric metrics -->
            <div
              v-for="header in reportData.headers.filter(h => h.type === 'metric' || h.type === 'rate').slice(0, 4)"
              :key="header.key"
              class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm group/tooltip relative"
            >
              <div class="flex justify-between items-start mb-1">
                <p
                  class="text-xs font-bold text-slate-500 uppercase tracking-wide"
                >
                  {{ header.label }}
                </p>
                <Info
                  class="w-4 h-4 text-slate-300 group-hover/tooltip:text-indigo-400 transition-colors cursor-help"
                />
              </div>
              <p class="text-2xl font-bold text-slate-900">
                {{ formatValue(header.key, reportData.totals[header.key]) }}
              </p>
              <!-- Cumulative Sparkline for Total -->
              <div class="mt-2 h-8 w-full">
                <Sparkline
                  :data="getCumulativeTotal(header.key)"
                  color="#6366f1"
                />
              </div>
              <!-- Tooltip -->
              <div
                class="absolute top-full left-2 right-2 mt-2 bg-slate-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg"
              >
                {{ getMetricTooltip(header.key) }}
              </div>
            </div>
          </div>

          <!-- Data Table -->
          <div class="overflow-x-auto px-4 md:px-8 no-scrollbar mt-4">
            <div class="inline-block min-w-full bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
              <table class="min-w-full divide-y divide-slate-100 [&_tbody_tr:last-child_td:first-child]:rounded-bl-xl [&_tbody_tr:last-child_td:last-child]:rounded-br-xl">
                <caption class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 text-left rounded-t-xl">
                  <div class="flex justify-between items-center">
                    <h3 class="font-bold text-slate-800">Detailed Breakdown</h3>
                    <span class="text-xs text-slate-500">{{ reportData.rows.length }} rows</span>
                  </div>
                </caption>
                <thead
                  ref="theadRef"
                  class="bg-slate-50"
                  :class="{ 'shadow-[0_2px_4px_-1px_rgba(0,0,0,0.1)]': isTheadStuck }"
                  :style="{ transform: `translateY(${stickyOffset}px)`, position: 'relative', zIndex: isTheadStuck ? 10 : undefined, willChange: stickyOffset ? 'transform' : undefined }"
                >
                  <tr>
                    <th
                      v-for="header in reportData.headers"
                      :key="header.key"
                      @click="header.type !== 'sparkline' && handleSort(header.key)"
                      class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap group select-none bg-slate-50"
                      :class="{'cursor-pointer hover:text-indigo-600': header.type !== 'sparkline'}"
                    >
                      <div class="flex items-center gap-1">
                        {{ header.label }}
                        <template v-if="header.type !== 'sparkline'">
                          <div class="w-4 h-4 flex items-center justify-center">
                            <template v-if="sortKey === header.key">
                              <ChevronUp v-if="sortOrder === 'asc'" class="w-3 h-3 text-indigo-600" />
                              <ChevronDown v-else class="w-3 h-3 text-indigo-600" />
                            </template>
                            <ChevronDown v-else class="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </template>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-50">
                  <tr
                    v-for="(row, idx) in sortedRows"
                    :key="idx"
                    class="hover:bg-slate-50 transition-colors"
                  >
                    <td
                      v-for="header in reportData.headers"
                      :key="header.key"
                      class="px-6 py-4 text-sm text-slate-700"
                      :class="{
                        'font-mono': header.type !== 'dimension' && header.type !== 'sparkline',
                        'font-medium': header.type === 'dimension',
                        'whitespace-nowrap': header.key !== 'caption' && header.type !== 'sparkline',
                        'min-w-[300px] max-w-md': header.key === 'caption',
                        'text-right': header.type === 'metric' || header.type === 'rate'
                      }"
                    >
                      <template v-if="header.type === 'sparkline'">
                        <Sparkline
                          :data="getSparklineData(row, header.metric)"
                          color="#818cf8"
                        />
                      </template>

                      <template
                        v-else-if="header.key === 'thumbnail_url' && row[header.key]"
                      >
                        <a
                          v-if="row.permalink"
                          :href="row.permalink"
                          target="_blank"
                          class="block w-24 h-24 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 transition-all group/thumb"
                          title="Click to view original post"
                        >
                          <img
                            :src="row[header.key]"
                            class="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                            alt="Post thumbnail"
                          />
                        </a>
                        <div
                          v-else
                          class="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm"
                        >
                          <img
                            :src="row[header.key]"
                            class="w-full h-full object-cover"
                            alt="Post thumbnail"
                          />
                        </div>
                      </template>

                      <template v-else-if="header.key === 'caption'">
                        <div class="group/caption relative">
                          <p
                            class="line-clamp-3 text-xs leading-relaxed text-slate-600 group-hover/caption:text-slate-900 transition-colors"
                          >
                            {{ row[header.key] || 'No caption' }}
                          </p>
                          <!-- Tooltip for long captions -->
                          <div
                            v-if="row[header.key] && row[header.key].length > 100"
                            class="absolute z-[60] bottom-full left-0 mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-xl opacity-0 group-hover/caption:opacity-100 pointer-events-none transition-all duration-200 shadow-2xl scale-95 group-hover/caption:scale-100 origin-bottom-left whitespace-pre-wrap"
                          >
                            <div
                              class="font-medium mb-1 text-slate-400 uppercase tracking-wider text-[10px]"
                            >
                              Full Caption
                            </div>
                            {{ row[header.key] }}
                            <div
                              class="absolute top-full left-6 -mt-1 border-4 border-transparent border-t-slate-900"
                            ></div>
                          </div>
                        </div>
                      </template>

                      <template
                        v-else-if="header.key === 'permalink' && row[header.key]"
                      >
                        <a
                          :href="row[header.key]"
                          target="_blank"
                          class="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-xs font-medium group/link"
                        >
                          View Post
                          <ExternalLink
                            class="w-3 h-3 ml-1.5 opacity-60 group-hover/link:opacity-100 transition-opacity"
                          />
                        </a>
                      </template>

                      <template v-else>
                        {{ formatValue(header.key, row[header.key]) }}
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
