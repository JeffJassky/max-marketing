<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  Search,
  Ban,
  CheckCircle,
  TrendingDown,
  DollarSign,
  MousePointer2,
  Calendar,
  Check,
  ArrowRight,
  Activity,
  Wallet,
  Layers,
  AlertTriangle,
  ArrowRightLeft,
  PauseCircle,
  Layout,
  ShieldAlert,
  Sparkles,
  Sliders,
  RefreshCw,
  ChevronDown,
  Smartphone,
  Wifi,
  Globe,
  Target,
  Info,
  ExternalLink
} from 'lucide-vue-next';

const GoogleAdsSubView = {
  OVERVIEW: 'OVERVIEW',
  KEYWORD_INTEL: 'KEYWORD_INTEL',
  WASTE_GUARD: 'WASTE_GUARD',
  CREATIVE_LAB: 'CREATIVE_LAB',
  PMAX_POWER: 'PMAX_POWER',
  CAMPAIGN_OPS: 'CAMPAIGN_OPS',
  ROADMAP: 'ROADMAP'
} as const;

type GoogleAdsSubView = typeof GoogleAdsSubView[keyof typeof GoogleAdsSubView];
type ConfidenceLevel = 'High' | 'Medium' | 'Low';
type UserGoal = 'CPA' | 'ROAS';
interface Account {
  id: string;
  name: string;
}

interface NegativeKeywordOpportunity {
  id: string;
  keyword_text?: string;
  keyword_match_type?: 'Broad' | 'Phrase' | 'Exact';
  campaign?: string;
  strategy_family: 'conversions' | 'clicks' | 'unknown';
  spend: number;
  conversions: number;
  clicks: number;
  intentTag?: 'Job Seeker' | 'Free Seeker' | 'Competitor' | 'Irrelevant';
  confidence?: number;
}

interface SearchTermDrift {
  id: string;
  keyword: string;
  matchType: string;
  searchTerm: string;
  semanticDistance: 'High' | 'Medium' | 'Low';
  spend: string;
  driftScore: number;
  confidenceLevel: ConfidenceLevel;
}

interface LowPerfKeyword {
  id: string;
  keyword: string;
  campaign: string;
  spend: string;
  cpa: string;
  roas: string;
  qs: number;
  issue: 'Zero Conversions' | 'High CPA' | 'Low ROAS' | 'Low QS';
  confidenceLevel: ConfidenceLevel;
}

interface WasteMetric {
  id: string;
  dimension: 'Location' | 'Device' | 'Time' | 'Network' | 'Placement';
  segmentName: string;
  spend: string;
  conversions: number;
  roas: string;
  wasteScore: number;
  recommendation: string;
  impactLevel: 'High' | 'Medium' | 'Low';
  potentialSavings: string;
}

interface ConversionHealth {
  id: string;
  actionName: string;
  platformSource: 'Google Ads';
  comparisonSource: 'GA4' | 'Shopify';
  discrepancy: string;
  status: 'Healthy' | 'Overcounting' | 'Undercounting' | 'Inactive';
  severity: 'Critical' | 'Warning' | 'Info';
  issueDescription: string;
}

interface SettingsAuditItem {
  id: string;
  settingName: string;
  campaign: string;
  currentValue: string;
  recommendedValue: string;
  impact: 'High' | 'Medium';
  estimatedSavings: string;
}

interface BidStrategyStatus {
  id: string;
  campaign: string;
  currentStrategy: string;
  recommendedStrategy: string;
  status: 'Learning' | 'Limited' | 'Misconfigured' | 'Optimized';
  reason: string;
  upliftPotential: string;
}

interface BudgetPacing {
  id: string;
  campaign: string;
  dailyBudget: string;
  currentSpend: string;
  projectedSpend: string;
  roas: string;
  status: 'Underpacing' | 'On Track' | 'Overpacing' | 'Limited by Budget';
  reallocationOpportunity?: {
    targetCampaign: string;
    amount: string;
    projectedUplift: string;
  };
}

interface QualityScoreComponent {
  component: 'Expected CTR' | 'Ad Relevance' | 'Landing Page Exp';
  status: 'Above Average' | 'Average' | 'Below Average';
}

interface QualityScoreItem {
  id: string;
  keyword: string;
  score: number;
  components: QualityScoreComponent[];
  costPenalty: string;
  campaign: string;
}

interface AdAssetPerformance {
  id: string;
  assetText: string;
  type: 'Headline' | 'Description' | 'Image';
  performance: 'Best' | 'Good' | 'Low';
  impressions: string;
  recommendation: 'Scale' | 'Retire' | 'Test';
}

interface PMaxChannelMetric {
  channel: 'Shopping' | 'Search' | 'Display' | 'YouTube' | 'Gmail' | 'Other';
  spend: string;
  roas: string;
  conversionValue: string;
  percentage: number;
  isInferred: boolean;
}

interface PMaxAlternative {
  pmaxCampaign: string;
  suggestedSplit: {
    searchStructure: string;
    shoppingStructure: string;
  };
  projectedEfficiencyGain: string;
}

interface GoogleAdsFullReport {
  dateRange: string;
  accountHealth: {
    optimizationScore: number;
    monthlyWaste: string;
    pmaxEfficiency: string;
    adStrength: string;
  };
  topPriorityActions: Array<{
    id: string;
    title: string;
    subtitle: string;
    impact: string;
    tab: GoogleAdsSubView;
  }>;
  clusterA: {
    negativeKeywords: NegativeKeywordOpportunity[];
    drift: SearchTermDrift[];
    lowPerf: LowPerfKeyword[];
  };
  clusterB: {
    waste: WasteMetric[];
    conversionHealth: ConversionHealth[];
    settingsAudit: SettingsAuditItem[];
  };
  clusterC: {
    bidStrategies: BidStrategyStatus[];
    budgetPacing: BudgetPacing[];
  };
  clusterD: {
    qualityScores: QualityScoreItem[];
    adAssets: AdAssetPerformance[];
  };
  clusterE: {
    pmaxBreakdown: PMaxChannelMetric[];
    alternatives: PMaxAlternative[];
  };
}

interface WastedKeywordSignal {
  row_id?: string;
  account_id: string;
  campaign_id?: string;
  campaign?: string;
  keyword_text: string;
  strategy_family?: string;
  bidding_strategy_type?: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  conversions_value: number;
  keyword_match_type?: string;
  last_seen?: { value?: { value?: string } };
  impact?: number;
  confidence?: number;
  detected_at?: { value?: string };
  signal_id: string;
}

interface ActionLog {
  date: string;
  action: string;
  savings: string;
  status?: 'Pending' | 'Applied' | 'Failed';
}

interface RoadmapTask {
  id: string;
  label: string;
  subLabel: string;
  completed: boolean;
  month: 1 | 2;
  impact?: 'High' | 'Medium' | 'Low';
  category?: string;
}

interface ConfirmationAction {
  type: string;
  title: string;
  description: string;
  onConfirm: () => void;
}

const dateOptions = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Year to Date'];

const activeTab = ref<GoogleAdsSubView>(GoogleAdsSubView.OVERVIEW);
const report = ref<GoogleAdsFullReport | null>(null);
const loading = ref(true);
const dateRange = ref('Last 30 Days');
const userGoal = ref<UserGoal>('ROAS');
const accounts = ref<Account[]>([]);
const selectedAccount = ref<Account | null>(null);
const accountsLoading = ref(false);
const accountsError = ref<string | null>(null);
const wastedKeywordSignals = ref<WastedKeywordSignal[]>([]);
const keywordSignalsLoading = ref(false);
const keywordSignalsError = ref<string | null>(null);
const lastAccountIdForSignals = ref<string | null>(null);

const selectedNegatives = ref<string[]>([]);
const confirmationAction = ref<ConfirmationAction | null>(null);

const blockedNegatives = ref<string[]>([]);
const pausedKeywords = ref<string[]>([]);
const fixedSettings = ref<string[]>([]);
const excludedWaste = ref<string[]>([]);
const retiredAssets = ref<string[]>([]);

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
  { id: GoogleAdsSubView.OVERVIEW, label: 'Overview', icon: Layout },
  { id: GoogleAdsSubView.KEYWORD_INTEL, label: 'Keyword Intel', icon: Search },
  { id: GoogleAdsSubView.WASTE_GUARD, label: 'Waste Guard', icon: ShieldAlert },
  { id: GoogleAdsSubView.CREATIVE_LAB, label: 'Creative Lab', icon: Sparkles },
  { id: GoogleAdsSubView.PMAX_POWER, label: 'PMax Power', icon: Layers },
  { id: GoogleAdsSubView.CAMPAIGN_OPS, label: 'Campaign Ops', icon: Sliders },
  { id: GoogleAdsSubView.ROADMAP, label: 'Roadmap', icon: Calendar }
]);

const useKeywordSignals = computed(() => lastAccountIdForSignals.value === selectedAccount.value?.id);

const filteredNegatives = computed(() => {
  const source = useKeywordSignals.value ? wastedKeywordSignals.value : report.value?.clusterA.negativeKeywords || [];

  return source.filter((nk: any) => {
    const id = nk.row_id ?? nk.id ?? `${nk.account_id ?? 'acct'}-${nk.campaign_id ?? 'camp'}-${nk.keyword_text ?? 'kw'}`;
    return !blockedNegatives.value.includes(id);
  });
});

const filteredWaste = computed(() =>
  report.value ? report.value.clusterB.waste.filter((w) => !excludedWaste.value.includes(w.id)) : []
);

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

const formatCurrency = (value: number) =>
  `$${(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const addActionLog = (action: string, savings: string) => {
  wasteWatchLog.value = [{ date: formatDate(new Date()), action, savings }, ...wasteWatchLog.value];
};

const openConfirmation = (action: ConfirmationAction) => {
  confirmationAction.value = action;
};

const closeConfirmation = () => {
  confirmationAction.value = null;
};

const loadAccounts = async () => {
  accountsLoading.value = true;
  accountsError.value = null;
  try {
    const response = await fetch('/api/accounts');
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.status}`);
    }

    const data = (await response.json()) as Account[];
    accounts.value = Array.isArray(data) ? data : [];

    if (
      accounts.value.length &&
      (!selectedAccount.value || !accounts.value.find((account) => account.id === selectedAccount.value?.id))
    ) {
      selectedAccount.value = accounts.value[0];
    }
  } catch (err) {
    console.error(err);
    accountsError.value = 'Unable to load accounts';
  } finally {
    accountsLoading.value = false;
  }
};

const loadWastedKeywordSignals = async (accountId?: string) => {
  const targetAccountId = accountId || selectedAccount.value?.id;
  if (!targetAccountId) return;

  keywordSignalsLoading.value = true;
  keywordSignalsError.value = null;

  try {
    const response = await fetch(`/api/signals/wasted-keyword-spend?accountId=${encodeURIComponent(targetAccountId)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch keyword signals: ${response.status}`);
    }
    const data = (await response.json()) as WastedKeywordSignal[];
    wastedKeywordSignals.value = Array.isArray(data) ? data : [];
    lastAccountIdForSignals.value = targetAccountId;
  } catch (err) {
    console.error(err);
    keywordSignalsError.value = 'Unable to load keyword signals';
    wastedKeywordSignals.value = [];
  } finally {
    keywordSignalsLoading.value = false;
  }
};

const loadReport = async (accountId?: string) => {
  loading.value = true;
  try {
    const targetAccountId = accountId || selectedAccount.value?.id || 'client_123';
    report.value = await getFullSuiteReport(targetAccountId);
  } catch (err) {
    console.error(err);
    report.value = null;
  } finally {
    loading.value = false;
  }
};

const toggleRoadmapTask = (taskId: string) => {
  roadmapTasks.value = roadmapTasks.value.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
};

const toggleNegativeSelection = (id: string, isChecked: boolean) => {
  if (isChecked && !selectedNegatives.value.includes(id)) {
    selectedNegatives.value = [...selectedNegatives.value, id];
  } else if (!isChecked) {
    selectedNegatives.value = selectedNegatives.value.filter((item) => item !== id);
  }
};

const confirmBlockNegatives = () => {
  if (!selectedNegatives.value.length) return;
  openConfirmation({
    type: 'BLOCK_NEGATIVES',
    title: `Block ${selectedNegatives.value.length} Keywords`,
    description: `You are about to add ${selectedNegatives.value.length} negative keywords at the Campaign level. This will stop future spend on these terms.`,
    onConfirm: executeBlockNegatives
  });
};

const confirmPauseKeyword = (keyword: LowPerfKeyword) => {
  openConfirmation({
    type: 'PAUSE_KEYWORD',
    title: 'Pause Keyword',
    description: `Are you sure you want to pause "${keyword.keyword}"? It has spent ${keyword.spend} with poor results.`,
    onConfirm: () => executePauseKeyword(keyword.id, keyword.keyword)
  });
};

const confirmExcludeWaste = (waste: WasteMetric) => {
  openConfirmation({
    type: 'EXCLUDE_WASTE',
    title: `Exclude ${waste.segmentName}`,
    description: `Confirm exclusion of this ${waste.dimension} segment. Estimated savings: ${waste.potentialSavings}`,
    onConfirm: () => handleExcludeWaste(waste.id, waste.segmentName, waste.potentialSavings)
  });
};

const confirmFixSetting = (setting: SettingsAuditItem) => {
  openConfirmation({
    type: 'FIX_SETTING',
    title: `Fix ${setting.settingName}`,
    description: `Change ${setting.settingName} to "${setting.recommendedValue}" for campaign "${setting.campaign}".`,
    onConfirm: () => handleFixSetting(setting.id, setting.settingName, setting.estimatedSavings)
  });
};

const confirmRetireAsset = (asset: AdAssetPerformance) => {
  if (asset.recommendation !== 'Retire') return;
  openConfirmation({
    type: 'RETIRE_ASSET',
    title: 'Retire Asset',
    description: 'This will pause the low-performing asset in its ad group.',
    onConfirm: () => handleRetireAsset(asset.id, asset.assetText)
  });
};

const handleConfirmAction = () => {
  if (confirmationAction.value) {
    confirmationAction.value.onConfirm();
    confirmationAction.value = null;
  }
};

const executeBlockNegatives = () => {
  const count = selectedNegatives.value.length;
  blockedNegatives.value = [...blockedNegatives.value, ...selectedNegatives.value];
  selectedNegatives.value = [];
  addActionLog(`Blocked ${count} negative keywords`, 'Est. $450/mo');
};

const executePauseKeyword = (id: string, keyword: string) => {
  pausedKeywords.value = [...pausedKeywords.value, id];
  addActionLog(`Paused keyword "${keyword}"`, 'Est. efficiency gain');
};

const handleExcludeWaste = (id: string, segmentName: string, savings: string) => {
  excludedWaste.value = [...excludedWaste.value, id];
  addActionLog(`Excluded ${segmentName}`, savings);
};

const handleFixSetting = (id: string, settingName: string, savings: string) => {
  fixedSettings.value = [...fixedSettings.value, id];
  addActionLog(`Updated ${settingName}`, savings);
};

const handleRetireAsset = (id: string, assetText: string) => {
  retiredAssets.value = [...retiredAssets.value, id];
  addActionLog(`Retired asset "${assetText}"`, 'Efficiency gain');
};

const budgetPercent = (bp: BudgetPacing) => {
  const spend = parseInt(bp.currentSpend.replace(/[^0-9]/g, ''), 10);
  const total = parseInt(bp.projectedSpend.replace(/[^0-9]/g, ''), 10);
  if (!total) return 0;
  return Math.min((spend / total) * 100, 100);
};

const getFullSuiteReport = async (_clientId: string): Promise<GoogleAdsFullReport> => {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    dateRange: 'Last 30 Days',
    accountHealth: {
      optimizationScore: 72,
      monthlyWaste: '$680',
      pmaxEfficiency: '3.2x',
      adStrength: 'Good'
    },
    topPriorityActions: [
      { id: 'act1', title: 'Block 3 High-Spend Negative Terms', subtitle: 'Save est. $420/mo', impact: '$420', tab: GoogleAdsSubView.KEYWORD_INTEL },
      { id: 'act2', title: 'Fix Conversion Tag Misfire', subtitle: 'Critical Accuracy Issue', impact: 'High', tab: GoogleAdsSubView.WASTE_GUARD },
      { id: 'act3', title: 'Shift Budget to "Best Sellers"', subtitle: 'Gain +12 Conversions', impact: '+12 Conv', tab: GoogleAdsSubView.CAMPAIGN_OPS }
    ],
    clusterA: {
      negativeKeywords: [],
      drift: [
        {
          id: 'd1',
          keyword: 'Gibson Les Paul',
          matchType: 'Phrase',
          searchTerm: 'Epiphone Les Paul vs Gibson',
          semanticDistance: 'Medium',
          spend: '$95.00',
          driftScore: 65,
          confidenceLevel: 'Medium'
        },
        {
          id: 'd2',
          keyword: 'Drum Kit',
          matchType: 'Exact (Close Variant)',
          searchTerm: 'Toy Drum Set for Toddlers',
          semanticDistance: 'High',
          spend: '$45.00',
          driftScore: 85,
          confidenceLevel: 'High'
        }
      ],
      lowPerf: [
        { id: 'k1', keyword: 'buy drums online cheap', campaign: 'Drums - General', spend: '$145.20', cpa: '$145.20', roas: '0.1x', qs: 3, issue: 'High CPA', confidenceLevel: 'High' },
        { id: 'k2', keyword: 'synthesizer repair DIY', campaign: 'Synths', spend: '$41.00', cpa: '-', roas: '0.0x', qs: 4, issue: 'Zero Conversions', confidenceLevel: 'Medium' }
      ]
    },
    clusterB: {
      waste: [
        { id: 'w1', dimension: 'Network', segmentName: 'Search Partners', spend: '$124.00', conversions: 1, roas: '0.2x', wasteScore: 85, recommendation: 'Disable Search Partners', impactLevel: 'Medium', potentialSavings: '$110/mo' },
        { id: 'w2', dimension: 'Location', segmentName: 'Alaska (Out of Shipping)', spend: '$56.00', conversions: 0, roas: '0.0x', wasteScore: 95, recommendation: 'Exclude Location', impactLevel: 'Low', potentialSavings: '$56/mo' },
        { id: 'w3', dimension: 'Device', segmentName: 'Mobile Apps (Display)', spend: '$210.00', conversions: 2, roas: '0.4x', wasteScore: 90, recommendation: 'Exclude Placement Category', impactLevel: 'High', potentialSavings: '$180/mo' }
      ],
      conversionHealth: [
        { id: 'c1', actionName: 'Submit Lead Form', platformSource: 'Google Ads', comparisonSource: 'GA4', discrepancy: '+45%', status: 'Overcounting', severity: 'Critical', issueDescription: 'Count set to "Every" instead of "One" per session.' },
        { id: 'c2', actionName: 'Page View (Key Page)', platformSource: 'Google Ads', comparisonSource: 'GA4', discrepancy: '0%', status: 'Healthy', severity: 'Info', issueDescription: 'Primary Action is Pageview - recommend demoting to Secondary.' }
      ],
      settingsAudit: [
        { id: 's1', settingName: 'Search Partners', campaign: 'Local - General', currentValue: 'Enabled', recommendedValue: 'Disabled', impact: 'Medium', estimatedSavings: '$80/mo' },
        { id: 's2', settingName: 'Location Options', campaign: 'National Shipping', currentValue: 'Presence or Interest', recommendedValue: 'Presence Only', impact: 'High', estimatedSavings: '$150/mo' }
      ]
    },
    clusterC: {
      bidStrategies: [
        { id: 'b1', campaign: 'Accessories - Cables', currentStrategy: 'Maximize Conversions', recommendedStrategy: 'Target ROAS (300%)', status: 'Misconfigured', reason: 'High volume (50+ conv/mo) allows for value-based bidding.', upliftPotential: '+15% ROAS' },
        { id: 'b2', campaign: 'Guitars - High End', currentStrategy: 'Target ROAS (400%)', recommendedStrategy: 'Target ROAS (400%)', status: 'Optimized', reason: 'Running efficiently.', upliftPotential: '-' }
      ],
      budgetPacing: [
        { id: 'bp1', campaign: 'General Awareness', dailyBudget: '$50', currentSpend: '$1,450', projectedSpend: '$1,500', roas: '1.2x', status: 'On Track' },
        { id: 'bp2', campaign: 'High Intent - Guitars', dailyBudget: '$100', currentSpend: '$2,800', projectedSpend: '$2,800', roas: '4.5x', status: 'Limited by Budget', reallocationOpportunity: { targetCampaign: 'General Awareness', amount: '$300', projectedUplift: '+12 Conversions' } }
      ]
    },
    clusterD: {
      qualityScores: [
        {
          id: 'qs1',
          keyword: 'professional recording gear',
          score: 3,
          components: [
            { component: 'Landing Page Exp', status: 'Below Average' },
            { component: 'Ad Relevance', status: 'Average' },
            { component: 'Expected CTR', status: 'Average' }
          ],
          costPenalty: '$210/mo',
          campaign: 'Audio Gear'
        },
        {
          id: 'qs2',
          keyword: 'gibson acoustic',
          score: 5,
          components: [
            { component: 'Ad Relevance', status: 'Below Average' },
            { component: 'Landing Page Exp', status: 'Above Average' },
            { component: 'Expected CTR', status: 'Average' }
          ],
          costPenalty: '$150/mo',
          campaign: 'Guitars - High End'
        }
      ],
      adAssets: [
        { id: 'aa1', assetText: 'Free Shipping Over $50', type: 'Headline', performance: 'Best', impressions: '15k', recommendation: 'Scale' },
        { id: 'aa2', assetText: 'Best Guitars In Town', type: 'Headline', performance: 'Low', impressions: '8k', recommendation: 'Retire' },
        { id: 'aa3', assetText: 'Huge Selection', type: 'Description', performance: 'Good', impressions: '12k', recommendation: 'Test' }
      ]
    },
    clusterE: {
      pmaxBreakdown: [
        { channel: 'Shopping', spend: '$850', roas: '4.2x', conversionValue: '$3,570', percentage: 65, isInferred: false },
        { channel: 'Search', spend: '$250', roas: '1.8x', conversionValue: '$450', percentage: 20, isInferred: true },
        { channel: 'Display', spend: '$150', roas: '0.5x', conversionValue: '$75', percentage: 10, isInferred: true },
        { channel: 'YouTube', spend: '$50', roas: '0.0x', conversionValue: '$0', percentage: 5, isInferred: true }
      ],
      alternatives: [
        { pmaxCampaign: 'PMax - All Products', suggestedSplit: { searchStructure: 'Brand + Non-Brand Search', shoppingStructure: 'Standard Shopping (High Margin)' }, projectedEfficiencyGain: '+15% ROAS' }
      ]
    }
  };
};

onMounted(async () => {
  await loadAccounts();
  if (!selectedAccount.value) {
    loadReport();
  }
});
watch(
  () => activeTab.value,
  (tab) => {
    if (tab === GoogleAdsSubView.KEYWORD_INTEL && selectedAccount.value) {
      if (lastAccountIdForSignals.value !== selectedAccount.value.id || !wastedKeywordSignals.value.length) {
        loadWastedKeywordSignals(selectedAccount.value.id);
      }
    }
  }
);
watch(selectedAccount, (account, prevAccount) => {
  if (account?.id && account.id !== prevAccount?.id) {
    loadReport(account.id);
    if (activeTab.value === GoogleAdsSubView.KEYWORD_INTEL) {
      loadWastedKeywordSignals(account.id);
    }
  }
});
watch(dateRange, () => {
  loadReport(selectedAccount.value?.id);
});
</script>

<template>
  <div class="h-full flex flex-col bg-white min-h-screen">
    <div
      v-if="loading"
      class="flex items-center justify-center h-screen bg-slate-50 w-full"
    >
      <div class="flex flex-col items-center animate-pulse">
        <div class="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
        <div class="h-4 w-48 bg-slate-200 rounded"></div>
      </div>
    </div>

    <div
      v-else-if="!report"
      class="flex items-center justify-center h-screen bg-slate-50 w-full"
    >
      <div class="text-slate-600">Error loading report.</div>
    </div>

    <template v-else>
      <div
        class="bg-white border-b border-slate-200 pt-6 pb-0 px-4 md:px-8 sticky top-0 z-30 shadow-sm"
      >
        <div
          class="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4"
        >
          <div>
            <h1 class="text-2xl font-bold text-slate-900 flex items-center">
              <img
                src="https://www.gstatic.com/images/branding/product/1x/ads_2022_48dp.png"
                class="w-8 h-8 mr-3"
                alt="Ads"
              />
              Google Ads Suite
            </h1>
            <div class="mt-2 flex items-center gap-3">
              <div class="relative group">
                <button
                  class="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-indigo-200 hover:text-indigo-700 shadow-sm min-w-[240px]"
                  :class="accountsLoading ? 'cursor-wait opacity-80' : 'cursor-pointer'"
                >
                  <Wallet class="w-4 h-4 mr-3 text-indigo-500" />
                  <div class="text-left flex-1 leading-tight">
                    <p
                      class="text-[11px] uppercase text-slate-400 font-bold tracking-wide"
                    >
                      Account
                    </p>
                    <p
                      v-if="selectedAccount"
                      class="text-sm font-semibold text-slate-900"
                    >
                      {{ selectedAccount.name }}
                    </p>
                    <p v-if="selectedAccount" class="text-xs text-slate-500">
                      ID: {{ selectedAccount.id }}
                    </p>
                    <p v-else class="text-sm text-slate-500">
                      {{ accountsLoading ? 'Loading accounts...' : 'Select an account' }}
                    </p>
                  </div>
                  <ChevronDown class="w-4 h-4 ml-2 text-slate-400" />
                </button>
                <div
                  class="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 hidden group-hover:block z-50 overflow-hidden"
                >
                  <div
                    v-if="accountsLoading"
                    class="px-4 py-3 text-sm text-slate-500"
                  >
                    Loading accounts...
                  </div>
                  <div
                    v-else-if="!accounts.length"
                    class="px-4 py-3 text-sm text-slate-500"
                  >
                    No accounts available
                  </div>
                  <template v-else>
                    <button
                      v-for="account in accounts"
                      :key="account.id"
                      class="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center justify-between transition-colors"
                      @click="selectedAccount = account"
                    >
                      <div>
                        <p class="text-sm font-semibold text-slate-900">
                          {{ account.name }}
                        </p>
                        <p class="text-xs text-slate-500">
                          ID: {{ account.id }}
                        </p>
                      </div>
                      <CheckCircle
                        v-if="selectedAccount?.id === account.id"
                        class="w-4 h-4 text-indigo-500"
                      />
                    </button>
                  </template>
                </div>
              </div>
              <span
                v-if="accountsError"
                class="text-xs text-red-500 font-medium"
                >{{ accountsError }}</span
              >
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3" v-if="false">
            <div
              class="bg-slate-100 p-1 rounded-lg flex text-xs font-bold mr-2"
            >
              <button
                class="px-3 py-1.5 rounded-md transition-all"
                :class="userGoal === 'CPA' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'"
                @click="userGoal = 'CPA'"
              >
                Lead Gen (CPA)
              </button>
              <button
                class="px-3 py-1.5 rounded-md transition-all"
                :class="userGoal === 'ROAS' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'"
                @click="userGoal = 'ROAS'"
              >
                E-com (ROAS)
              </button>
            </div>

            <div class="relative group">
              <button
                class="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Calendar class="w-4 h-4 mr-2 text-slate-500" />
                {{ dateRange }}
                <ChevronDown class="w-4 h-4 ml-2" />
              </button>
              <div
                class="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover:block z-50"
              >
                <button
                  v-for="d in dateOptions"
                  :key="d"
                  class="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                  @click="dateRange = d"
                >
                  {{ d }}
                </button>
              </div>
            </div>
            <button
              class="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center bg-slate-100 px-3 py-2 rounded-lg transition-colors"
              @click="loadReport(selectedAccount?.id)"
            >
              <RefreshCw class="w-3 h-3 mr-1.5" />
              Sync
            </button>
          </div>
        </div>

        <div class="flex space-x-1 overflow-x-auto no-scrollbar pb-0">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap"
            :class="activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'"
            @click="activeTab = tab.id"
          >
            <component
              :is="tab.icon"
              :class="['w-4 h-4 mr-2', activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400']"
            />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="flex-1 bg-slate-50 p-4 md:p-8 overflow-y-auto">
        <template v-if="activeTab === GoogleAdsSubView.OVERVIEW">
          <div class="max-w-7xl mx-auto">
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <div
                class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"
              >
                <div
                  class="flex justify-between items-start mb-4 relative z-10"
                >
                  <span class="text-slate-500 text-sm font-medium"
                    >Optimization Score</span
                  >
                  <Activity class="w-5 h-5 text-green-500" />
                </div>
                <div
                  class="text-4xl font-bold text-slate-900 mb-2 relative z-10"
                >
                  {{ report.accountHealth.optimizationScore }}%
                </div>
                <div
                  class="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative z-10"
                >
                  <div
                    class="bg-gradient-to-r from-orange-400 to-green-500 h-full rounded-full"
                    :style="{ width: `${report.accountHealth.optimizationScore}%` }"
                  ></div>
                </div>
                <div
                  class="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4"
                >
                  <Activity class="w-32 h-32 text-green-500" />
                </div>
              </div>
              <div
                class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
              >
                <div class="flex justify-between items-start mb-4">
                  <span class="text-slate-500 text-sm font-medium"
                    >Monthly Waste</span
                  >
                  <ShieldAlert class="w-5 h-5 text-red-500" />
                </div>
                <div class="text-4xl font-bold text-slate-900 mb-2">
                  {{ report.accountHealth.monthlyWaste }}
                </div>
                <p class="text-xs text-red-500 font-medium flex items-center">
                  <TrendingDown class="w-3 h-3 mr-1" />
                  Requires Attention
                </p>
              </div>
              <div
                class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
              >
                <div class="flex justify-between items-start mb-4">
                  <span class="text-slate-500 text-sm font-medium"
                    >PMax Efficiency</span
                  >
                  <Layers class="w-5 h-5 text-blue-500" />
                </div>
                <div class="text-4xl font-bold text-slate-900 mb-2">
                  {{ report.accountHealth.pmaxEfficiency }}
                </div>
                <p class="text-xs text-slate-500">ROAS (Last 30d)</p>
              </div>
              <div
                class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
              >
                <div class="flex justify-between items-start mb-4">
                  <span class="text-slate-500 text-sm font-medium"
                    >Ad Strength</span
                  >
                  <Sparkles class="w-5 h-5 text-indigo-500" />
                </div>
                <div class="text-4xl font-bold text-slate-900 mb-2">
                  {{ report.accountHealth.adStrength }}
                </div>
                <p class="text-xs text-slate-500">Avg. Asset Quality</p>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div
                class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
              >
                <div class="flex justify-between items-center mb-6">
                  <h3 class="font-bold text-slate-900 flex items-center">
                    <Target class="w-5 h-5 mr-2 text-orange-500" />
                    Top Priority Actions
                  </h3>
                  <span
                    class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold"
                    >3 Pending</span
                  >
                </div>
                <div class="space-y-4">
                  <div
                    v-for="(action, idx) in report.topPriorityActions"
                    :key="action.id"
                    class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-indigo-200 hover:shadow-sm transition-all group"
                    @click="activeTab = action.tab"
                  >
                    <div class="flex items-center">
                      <div
                        class="w-10 h-10 rounded-full flex items-center justify-center mr-4 font-bold text-lg"
                        :class="idx === 0 ? 'bg-red-100 text-red-600' : idx === 1 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'"
                      >
                        {{ idx + 1 }}
                      </div>
                      <div>
                        <p
                          class="text-sm font-bold text-slate-900 group-hover:text-indigo-700"
                        >
                          {{ action.title }}
                        </p>
                        <p class="text-xs text-slate-500">
                          {{ action.subtitle }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right flex items-center">
                      <span
                        class="text-xs font-bold px-2 py-1 rounded mr-4"
                        :class="idx === 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'"
                      >
                        Impact: {{ action.impact }}
                      </span>
                      <ArrowRight
                        class="w-4 h-4 text-slate-300 group-hover:text-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="bg-indigo-900 rounded-xl p-6 text-white relative overflow-hidden flex flex-col justify-between"
              >
                <div class="relative z-10">
                  <h3 class="text-xl font-bold mb-2 flex items-center">
                    <RefreshCw class="w-5 h-5 mr-2 animate-spin-slow" />
                    Auto-Pilot
                  </h3>
                  <p class="text-indigo-200 text-sm mb-6 leading-relaxed">
                    We are actively monitoring
                    <span class="text-white font-bold">14 campaigns</span> for
                    drift, waste, and creative fatigue.
                  </p>
                  <div class="space-y-2 mb-6">
                    <div class="flex items-center text-xs text-indigo-300">
                      <CheckCircle class="w-3 h-3 mr-2 text-green-400" />
                      Budget Pacing Active
                    </div>
                    <div class="flex items-center text-xs text-indigo-300">
                      <CheckCircle class="w-3 h-3 mr-2 text-green-400" />
                      Drift Detection On
                    </div>
                    <div class="flex items-center text-xs text-indigo-300">
                      <CheckCircle class="w-3 h-3 mr-2 text-green-400" />
                      Creative Watch On
                    </div>
                  </div>
                  <button
                    class="w-full bg-white text-indigo-900 px-4 py-3 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
                    @click="activeTab = GoogleAdsSubView.ROADMAP"
                  >
                    View Roadmap
                  </button>
                </div>
                <Sparkles
                  class="absolute -bottom-8 -right-8 w-48 h-48 text-indigo-800 opacity-30 rotate-12"
                />
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === GoogleAdsSubView.KEYWORD_INTEL">
          <div class="max-w-7xl mx-auto space-y-8">
            <div
              class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div
                class="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center"
              >
                <div>
                  <h3 class="font-bold text-slate-900 flex items-center">
                    <Ban class="w-4 h-4 mr-2 text-red-500" />
                    Negative Keyword Analyzer
                  </h3>
                  <p class="text-xs text-slate-500 mt-1">
                    Search terms with high spend &amp; zero value. Select to
                    block.
                  </p>
                </div>
                <button
                  v-if="selectedNegatives.length > 0"
                  class="mt-4 md:mt-0 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm flex items-center animate-in fade-in slide-in-from-bottom-2"
                  @click="confirmBlockNegatives"
                >
                  <Ban class="w-4 h-4 mr-2" />
                  Block {{ selectedNegatives.length }} Terms
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-100">
                  <thead class="bg-white">
                    <tr>
                      <th class="px-6 py-3 w-8">
                        <input
                          type="checkbox"
                          class="rounded border-slate-300"
                        />
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase"
                      >
                        Search Term
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase"
                      >
                        Campaign
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase"
                      >
                        Goal
                      </th>
                      <th
                        class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase"
                      >
                        Spend (90d)
                      </th>
                      <th
                        class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase"
                      >
                        Stats
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr v-if="keywordSignalsLoading">
                      <td
                        colspan="8"
                        class="px-6 py-6 text-center text-sm text-slate-500"
                      >
                        Loading keyword signals...
                      </td>
                    </tr>
                    <tr v-else-if="keywordSignalsError">
                      <td
                        colspan="8"
                        class="px-6 py-6 text-center text-sm text-red-500"
                      >
                        {{ keywordSignalsError }}
                      </td>
                    </tr>
                    <tr
                      v-else-if="useKeywordSignals && !filteredNegatives.length"
                    >
                      <td
                        colspan="8"
                        class="px-6 py-6 text-center text-sm text-slate-500"
                      >
                        No wasted keyword signals found.
                      </td>
                    </tr>
                    <template v-else>
                      <tr
                        v-for="nk in filteredNegatives"
                        class="hover:bg-slate-50 transition-colors"
                      >
                        <td class="px-6 py-4">
                          <input
                            type="checkbox"
                            class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td class="px-6 py-4">
                          <span
                            class="text-sm font-medium text-slate-900 block"
                            >{{ nk.keyword_text }}</span
                          >
                          <span
                            class="text-xs text-slate-400"
                            >{{ nk.keyword_match_type  || '—' }}</span
                          >
                        </td>
                        <td class="px-6 py-4 text-sm text-slate-700">
                          {{ nk.campaign || 'Unknown' }}
                        </td>
                        <td class="px-6 py-4">
                          <span
                            class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {{ nk.strategy_family || 'unknown' }}
                          </span>
                        </td>
                        <td
                          class="px-6 py-4 text-sm font-bold text-red-600 text-right"
                        >
                          {{ formatCurrency(typeof nk.spend === 'number' ? nk.spend : Number(String(nk.spend ?? 0).replace(/[^0-9.-]/g, '')) || 0) }}
                        </td>
                        <td class="px-6 py-4 text-right">
                          <div class="text-xs text-slate-500">
                            {{ nk.clicks ?? 0 }} Clicks<br />
                            {{ nk.conversions ?? 0 }} Conv.
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div
                class="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <div class="flex items-center justify-between mb-6">
                  <h3 class="font-bold text-slate-900 flex items-center">
                    <ArrowRightLeft class="w-4 h-4 mr-2 text-blue-500" />
                    Match Type Drift
                  </h3>
                  <span class="text-xs text-slate-400"
                    >Broad Match analysis</span
                  >
                </div>
                <div
                  v-for="drift in report.clusterA.drift"
                  :key="drift.id"
                  class="bg-slate-50 rounded-lg p-4 border border-slate-100 mb-4 last:mb-0"
                >
                  <div class="flex items-center justify-between mb-3 text-sm">
                    <div class="flex-1">
                      <span
                        class="block text-[10px] uppercase font-bold text-slate-400 mb-1"
                        >Keyword</span
                      >
                      <div
                        class="font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200"
                      >
                        {{ drift.keyword }}
                      </div>
                    </div>
                    <div class="px-2 text-slate-300">
                      <ArrowRight class="w-4 h-4" />
                    </div>
                    <div class="flex-1 text-right">
                      <span
                        class="block text-[10px] uppercase font-bold text-slate-400 mb-1"
                        >Drifted Query</span
                      >
                      <div
                        class="font-mono text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100"
                      >
                        {{ drift.searchTerm }}
                      </div>
                    </div>
                  </div>
                  <div
                    class="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/50"
                  >
                    <p class="text-xs text-slate-500 font-medium">
                      Drift Score: {{ drift.driftScore }}/100
                    </p>
                    <button
                      class="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-3 py-1 rounded hover:bg-blue-50"
                    >
                      Add Exact Match
                    </button>
                  </div>
                </div>
              </div>

              <div
                class="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <h3 class="font-bold text-slate-900 mb-6 flex items-center">
                  <TrendingDown class="w-4 h-4 mr-2 text-orange-500" />
                  Low-Performing Keywords
                </h3>
                <div class="space-y-3">
                  <div
                    v-for="k in report.clusterA.lowPerf"
                    :key="k.id"
                    class="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p class="text-sm font-bold text-slate-900">
                        {{ k.keyword }}
                      </p>
                      <p class="text-xs text-slate-400">{{ k.campaign }}</p>
                      <div class="flex space-x-3 mt-1 items-center">
                        <span
                          class="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold"
                          >{{ k.issue }}</span
                        >
                        <span class="text-xs text-slate-500"
                          >QS: {{ k.qs }}</span
                        >
                        <span class="text-xs text-slate-500"
                          >CPA: {{ k.cpa }}</span
                        >
                      </div>
                    </div>
                    <span
                      v-if="pausedKeywords.includes(k.id)"
                      class="text-xs font-bold text-slate-400 flex items-center"
                    >
                      <PauseCircle class="w-3 h-3 mr-1" />
                      Paused
                    </span>
                    <button
                      v-else
                      class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Pause Keyword"
                      @click="confirmPauseKeyword(k)"
                    >
                      <PauseCircle class="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === GoogleAdsSubView.WASTE_GUARD">
          <div class="max-w-7xl mx-auto space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                class="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <div class="flex items-center justify-between mb-6">
                  <h3 class="font-bold text-slate-900 flex items-center">
                    <DollarSign class="w-4 h-4 mr-2 text-slate-500" />
                    Multi-Dimension Waste
                  </h3>
                  <div class="text-xs text-slate-500">
                    Target: <span class="font-bold">{{ userGoal }}</span>
                  </div>
                </div>
                <div class="space-y-6">
                  <div
                    v-for="w in filteredWaste"
                    :key="w.id"
                    class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div class="flex items-start mb-3 sm:mb-0">
                      <div
                        class="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 mr-3 text-slate-400"
                      >
                        <component
                          :is="w.dimension === 'Network' ? Wifi : w.dimension === 'Device' ? Smartphone : Globe"
                          class="w-5 h-5"
                        />
                      </div>
                      <div>
                        <div class="flex items-center">
                          <span
                            class="text-sm font-bold text-slate-900 mr-2"
                            >{{ w.segmentName }}</span
                          >
                          <span
                            class="text-[10px] uppercase font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200"
                          >
                            {{ w.dimension }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1">
                          {{ w.recommendation }}
                        </p>
                      </div>
                    </div>
                    <div
                      class="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end"
                    >
                      <div class="text-right">
                        <p class="text-xs text-slate-400">Wasted Spend</p>
                        <p class="text-sm font-bold text-red-600">
                          {{ w.spend }}
                        </p>
                      </div>
                      <button
                        class="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded hover:border-red-300 hover:text-red-600 shadow-sm"
                        @click="confirmExcludeWaste(w)"
                      >
                        Exclude
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <h3 class="font-bold text-slate-900 mb-6 flex items-center">
                  <Activity class="w-4 h-4 mr-2 text-slate-500" />
                  Conversion Health
                </h3>
                <div class="space-y-4">
                  <div
                    v-for="c in report.clusterB.conversionHealth"
                    :key="c.id"
                    :class="[
                      'p-4 rounded-lg border',
                      c.status === 'Healthy' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                    ]"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span
                        :class="[
                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                          c.status === 'Healthy' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        ]"
                      >
                        {{ c.status }}
                      </span>
                      <span class="text-xs font-bold text-slate-500"
                        >{{ c.discrepancy }} vs {{ c.comparisonSource }}</span
                      >
                    </div>
                    <p class="text-sm font-bold text-slate-900">
                      {{ c.actionName }}
                    </p>
                    <p class="text-xs text-slate-600 mt-2 italic">
                      {{ c.issueDescription }}
                    </p>
                  </div>
                  <button
                    class="w-full py-2 text-xs font-bold text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50 mt-2"
                  >
                    Run Diagnostics
                  </button>
                </div>
              </div>
            </div>

            <div
              class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 class="font-bold text-slate-900">Settings Audit Engine</h3>
              </div>
              <div
                v-for="s in report.clusterB.settingsAudit"
                :key="s.id"
                class="p-6 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <div class="mb-4 md:mb-0">
                  <div class="flex items-center space-x-3 mb-1">
                    <span
                      class="text-sm font-bold text-slate-900"
                      >{{ s.settingName }}</span
                    >
                    <span
                      class="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium"
                      >Impact: {{ s.impact }}</span
                    >
                  </div>
                  <p class="text-sm text-slate-500">
                    Campaign: <span class="font-medium">{{ s.campaign }}</span>
                  </p>
                  <p class="text-xs text-slate-400 mt-1">
                    Current: {{ s.currentValue }}
                    <ArrowRight class="w-3 h-3 inline mx-1" />
                    Rec:
                    <span
                      class="text-slate-700 font-bold"
                      >{{ s.recommendedValue }}</span
                    >
                  </p>
                </div>
                <div class="flex items-center space-x-6">
                  <div class="text-right">
                    <p class="text-xs text-slate-400 font-medium uppercase">
                      Est. Savings
                    </p>
                    <p class="text-sm font-bold text-green-600">
                      {{ s.estimatedSavings }}
                    </p>
                  </div>
                  <span
                    v-if="fixedSettings.includes(s.id)"
                    class="text-green-600 text-sm font-bold flex items-center px-4"
                  >
                    <Check class="w-4 h-4 mr-2" />
                    Fixed
                  </span>
                  <button
                    v-else
                    class="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm transition-all"
                    @click="confirmFixSetting(s)"
                  >
                    Fix Setting
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === GoogleAdsSubView.CAMPAIGN_OPS">
          <div class="max-w-7xl mx-auto space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div
                class="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <h3 class="font-bold text-slate-900 mb-6 flex items-center">
                  <Sliders class="w-4 h-4 mr-2 text-slate-500" />
                  Bid Strategy Validator
                </h3>
                <div
                  v-for="bs in report.clusterC.bidStrategies"
                  :key="bs.id"
                  class="p-4 bg-slate-50 border border-slate-100 rounded-lg mb-4 last:mb-0"
                >
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <h4 class="font-bold text-slate-900 text-sm">
                        {{ bs.campaign }}
                      </h4>
                      <p class="text-xs text-slate-500">
                        Current: {{ bs.currentStrategy }}
                      </p>
                    </div>
                    <span
                      class="text-[10px] font-bold px-2 py-1 rounded border"
                      :class="bs.status === 'Optimized' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'"
                    >
                      {{ bs.status }}
                    </span>
                  </div>
                  <template v-if="bs.status !== 'Optimized'">
                    <div
                      class="mt-3 flex items-start bg-white p-2 rounded border border-orange-100 mb-3"
                    >
                      <AlertTriangle
                        class="w-4 h-4 text-orange-500 mr-2 flex-shrink-0"
                      />
                      <div>
                        <p class="text-xs text-orange-800 font-medium mb-1">
                          {{ bs.reason }}
                        </p>
                        <p class="text-xs text-slate-600">
                          Rec:
                          <span
                            class="font-bold"
                            >{{ bs.recommendedStrategy }}</span
                          >
                        </p>
                      </div>
                    </div>
                    <button
                      class="w-full py-1.5 text-xs bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Update Strategy
                    </button>
                  </template>
                </div>
              </div>

              <div
                class="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <h3 class="font-bold text-slate-900 mb-6 flex items-center">
                  <Wallet class="w-4 h-4 mr-2 text-slate-500" />
                  Budget Pacing &amp; Allocation
                </h3>
                <div
                  v-for="bp in report.clusterC.budgetPacing"
                  :key="bp.id"
                  class="mb-6 last:mb-0"
                >
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex-1">
                      <p class="text-sm font-bold text-slate-900 truncate">
                        {{ bp.campaign }}
                      </p>
                      <div class="flex items-center space-x-2">
                        <p class="text-xs text-slate-400">{{ bp.status }}</p>
                        <span
                          class="text-[10px] bg-indigo-50 text-indigo-700 px-1 rounded"
                          >ROAS {{ bp.roas }}</span
                        >
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-xs font-bold text-slate-700">
                        {{ bp.currentSpend }}
                        <span class="text-slate-400 font-normal"
                          >/ {{ bp.projectedSpend }}</span
                        >
                      </p>
                    </div>
                  </div>
                  <div
                    class="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3"
                  >
                    <div
                      class="h-full rounded-full"
                      :class="bp.status === 'Limited by Budget' ? 'bg-red-500' : 'bg-indigo-500'"
                      :style="{ width: `${budgetPercent(bp)}%` }"
                    ></div>
                  </div>
                  <div
                    v-if="bp.reallocationOpportunity"
                    class="bg-green-50 p-3 rounded border border-green-100 flex items-center justify-between"
                  >
                    <div class="flex items-center">
                      <ArrowRightLeft class="w-4 h-4 text-green-600 mr-2" />
                      <div>
                        <p class="text-xs text-green-800 font-bold">
                          Shift {{ bp.reallocationOpportunity.amount }} to "{{ bp.reallocationOpportunity.targetCampaign












                          }}"
                        </p>
                        <p class="text-[10px] text-green-700">
                          Gain {{ bp.reallocationOpportunity.projectedUplift }}
                        </p>
                      </div>
                    </div>
                    <button
                      class="text-xs bg-white border border-green-200 text-green-700 font-bold px-3 py-1.5 rounded shadow-sm hover:bg-green-100"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === GoogleAdsSubView.CREATIVE_LAB">
          <div class="max-w-7xl mx-auto space-y-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div
                class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div class="p-6 border-b border-slate-100">
                  <h3 class="font-bold text-slate-900 flex items-center">
                    <Target class="w-4 h-4 mr-2 text-indigo-500" />
                    Quality Score Breakdown
                  </h3>
                </div>
                <div class="divide-y divide-slate-100">
                  <div
                    v-for="qs in report.clusterD.qualityScores"
                    :key="qs.id"
                    class="p-6"
                  >
                    <div class="flex justify-between items-start mb-4">
                      <div>
                        <h4 class="font-bold text-slate-800 text-lg">
                          {{ qs.keyword }}
                        </h4>
                        <p class="text-xs text-slate-400">{{ qs.campaign }}</p>
                        <p class="text-xs text-red-500 font-medium mt-1">
                          Penalty: {{ qs.costPenalty }} due to low score
                        </p>
                      </div>
                      <div
                        class="w-10 h-10 flex items-center justify-center bg-slate-900 text-white font-bold rounded-lg shadow-md text-lg"
                      >
                        {{ qs.score }}
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                      <div
                        v-for="(comp, idx) in qs.components"
                        :key="idx"
                        class="p-2 rounded text-center border"
                        :class="comp.status === 'Below Average' ? 'bg-red-50 border-red-100' : comp.status === 'Average' ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'"
                      >
                        <p
                          class="text-[10px] uppercase font-bold text-slate-500 mb-1"
                        >
                          {{ comp.component }}
                        </p>
                        <p
                          class="text-xs font-bold"
                          :class="comp.status === 'Below Average' ? 'text-red-700' : comp.status === 'Average' ? 'text-orange-700' : 'text-green-700'"
                        >
                          {{ comp.status }}
                        </p>
                      </div>
                    </div>
                    <div class="mt-4 flex justify-end">
                      <button
                        class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center"
                      >
                        Improve
                        {{
                          qs.components.find((c) => c.status === 'Below Average')?.component || 'Score'
                        }}
                        <ExternalLink class="w-3 h-3 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div class="p-6 border-b border-slate-100">
                  <h3 class="font-bold text-slate-900 flex items-center">
                    <MousePointer2 class="w-4 h-4 mr-2 text-blue-500" />
                    Asset Performance
                  </h3>
                </div>
                <div class="divide-y divide-slate-100">
                  <div
                    v-for="ad in report.clusterD.adAssets"
                    :key="ad.id"
                    class="p-6 flex flex-col"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <div class="flex items-center mb-2">
                        <span
                          class="text-[10px] font-bold uppercase px-2 py-0.5 rounded mr-2"
                          :class="ad.performance === 'Best' ? 'bg-green-100 text-green-700' : ad.performance === 'Low' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'"
                        >
                          {{ ad.performance }}
                        </span>
                        <span
                          class="text-xs text-slate-400"
                          >{{ ad.type }}</span
                        >
                      </div>
                      <span class="text-xs font-mono text-slate-500"
                        >{{ ad.impressions }} imps</span
                      >
                    </div>

                    <p
                      class="text-sm font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3 italic"
                    >
                      "{{ ad.assetText }}"
                    </p>

                    <div class="flex justify-end">
                      <span
                        v-if="retiredAssets.includes(ad.id)"
                        class="text-xs text-slate-400 font-bold"
                        >Retired</span
                      >
                      <button
                        v-else
                        class="text-xs font-bold px-3 py-1.5 rounded border transition-colors"
                        :class="ad.recommendation === 'Retire' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'"
                        @click="confirmRetireAsset(ad)"
                      >
                        {{ ad.recommendation === 'Retire' ? 'Retire Asset' : 'Scale Asset' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === GoogleAdsSubView.PMAX_POWER">
          <div class="max-w-7xl mx-auto space-y-8">
            <div
              class="bg-white rounded-xl shadow-sm border border-slate-200 p-8"
            >
              <div class="flex justify-between items-end mb-8">
                <div>
                  <h3 class="font-bold text-slate-900 text-lg">
                    Channel Spending Breakdown
                  </h3>
                  <p class="text-sm text-slate-500">
                    Unveiling the "Black Box" of Performance Max
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-3xl font-bold text-indigo-600">$1,300</p>
                  <p class="text-xs text-slate-400 font-medium uppercase">
                    Total Spend
                  </p>
                </div>
              </div>

              <div
                class="flex h-16 rounded-lg overflow-hidden mb-8 shadow-inner ring-4 ring-slate-50"
              >
                <div
                  v-for="(item, idx) in report.clusterE.pmaxBreakdown"
                  :key="`${item.channel}-${idx}`"
                  class="h-full relative group transition-all hover:opacity-90 flex items-center justify-center"
                  :class="idx % 4 === 0 ? 'bg-blue-500' : idx % 4 === 1 ? 'bg-indigo-500' : idx % 4 === 2 ? 'bg-purple-500' : 'bg-red-500'"
                  :style="{ width: `${item.percentage}%` }"
                >
                  <span
                    v-if="item.percentage > 10"
                    class="text-white font-bold text-sm shadow-sm"
                    >{{ item.percentage }}%</span
                  >
                  <div
                    class="absolute top-full mt-2 hidden group-hover:block bg-slate-900 text-white text-xs p-2 rounded z-10 whitespace-nowrap shadow-xl"
                  >
                    {{ item.channel }}: {{ item.spend }}
                    {{ item.isInferred ? '(Inferred)' : '' }}
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  v-for="(item, idx) in report.clusterE.pmaxBreakdown"
                  :key="`${item.channel}-card-${idx}`"
                  class="p-4 border border-slate-100 rounded-lg hover:shadow-md transition-shadow relative"
                >
                  <div
                    class="text-xs font-bold uppercase mb-2"
                    :class="idx % 4 === 0 ? 'text-blue-500' : idx % 4 === 1 ? 'text-indigo-500' : idx % 4 === 2 ? 'text-purple-500' : 'text-red-500'"
                  >
                    {{ item.channel }}
                    <span
                      v-if="item.isInferred"
                      class="ml-1 text-slate-400 font-normal normal-case"
                      title="Estimated via heuristics"
                      >(Inferred)</span
                    >
                  </div>
                  <div class="flex justify-between items-baseline">
                    <div class="text-lg font-bold text-slate-900">
                      {{ item.spend }}
                    </div>
                    <div
                      class="text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600"
                    >
                      ROAS {{ item.roas }}
                    </div>
                  </div>
                  <div class="text-xs text-slate-400 mt-1">
                    Conv. Value: {{ item.conversionValue }}
                  </div>
                </div>
              </div>
            </div>

            <div
              v-for="(alt, idx) in report.clusterE.alternatives"
              :key="idx"
              class="bg-slate-900 text-slate-300 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden"
            >
              <div class="relative z-10 mb-6 md:mb-0">
                <div class="flex items-center space-x-2 mb-2">
                  <Sparkles class="w-5 h-5 text-yellow-400" />
                  <h3 class="text-white font-bold text-lg">
                    Efficiency Opportunity Detected
                  </h3>
                </div>
                <p class="text-sm max-w-lg mb-4 leading-relaxed">
                  Our models suggest splitting
                  <span class="text-white font-semibold"
                    >"{{ alt.pmaxCampaign }}"</span
                  >
                  into component campaigns could improve control and ROI.
                </p>
                <div class="flex space-x-4 text-xs font-mono">
                  <div
                    class="px-3 py-2 bg-slate-800 rounded border border-slate-700"
                  >
                    <span class="text-slate-400 block mb-1"
                      >Search Component</span
                    >
                    <span
                      class="text-white font-bold"
                      >{{ alt.suggestedSplit.searchStructure }}</span
                    >
                  </div>
                  <div
                    class="px-3 py-2 bg-slate-800 rounded border border-slate-700"
                  >
                    <span class="text-slate-400 block mb-1"
                      >Shopping Component</span
                    >
                    <span
                      class="text-white font-bold"
                      >{{ alt.suggestedSplit.shoppingStructure }}</span
                    >
                  </div>
                </div>
                <div
                  class="mt-4 flex items-center text-xs text-slate-500 bg-slate-800/50 p-2 rounded w-fit"
                >
                  <Info class="w-3 h-3 mr-2" />
                  Guidance Only: This does not create campaigns.
                </div>
              </div>
              <div
                class="relative z-10 text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10"
              >
                <p class="text-xs uppercase font-bold text-white/60 mb-1">
                  Projected Gain
                </p>
                <p class="text-3xl font-bold text-green-400 mb-3">
                  {{ alt.projectedEfficiencyGain }}
                </p>
                <button
                  class="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors w-full text-sm"
                >
                  Simulate Split
                </button>
              </div>
              <div
                class="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none"
              ></div>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === GoogleAdsSubView.ROADMAP">
          <div class="max-w-4xl mx-auto">
            <div class="mb-8">
              <h2 class="text-xl font-bold text-slate-900">
                Optimization Roadmap
              </h2>
              <p class="text-slate-500 text-sm">
                Your guided plan for the next 8 weeks.
              </p>
            </div>

            <div class="space-y-6">
              <div
                class="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm relative overflow-hidden"
              >
                <div
                  class="absolute top-0 left-0 w-1 h-full bg-indigo-500"
                ></div>
                <h3
                  class="text-lg font-bold text-slate-900 flex items-center mb-4"
                >
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
                      class="mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all"
                      :class="task.completed ? 'bg-green-100 border-green-200 text-green-600' : 'bg-white border-slate-300'"
                    >
                      <Check v-if="task.completed" class="w-3 h-3" />
                    </div>
                    <div
                      :class="task.completed ? 'opacity-50 transition-opacity' : ''"
                    >
                      <p
                        :class="['text-sm font-medium', task.completed ? 'text-slate-500 line-through' : 'text-slate-800']"
                      >
                        {{ task.label }}
                      </p>
                      <p class="text-xs text-slate-500">{{ task.subLabel }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-slate-50 rounded-xl border border-slate-200 p-6">
                <h3
                  class="text-lg font-bold text-slate-900 flex items-center mb-4"
                >
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
                      class="mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all"
                      :class="task.completed ? 'bg-green-100 border-green-200 text-green-600' : 'bg-white border-slate-300'"
                    >
                      <Check v-if="task.completed" class="w-3 h-3" />
                    </div>
                    <div
                      :class="task.completed ? 'opacity-50 transition-opacity' : ''"
                    >
                      <p
                        :class="['text-sm font-medium', task.completed ? 'text-slate-500 line-through' : 'text-slate-600']"
                      >
                        {{ task.label }}
                      </p>
                      <p class="text-xs text-slate-400">{{ task.subLabel }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <div
      v-if="confirmationAction"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div
        class="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div class="p-6">
          <h3 class="text-lg font-bold text-slate-900 mb-2">
            {{ confirmationAction.title }}
          </h3>
          <div class="text-slate-600 text-sm mb-6">
            {{ confirmationAction.description }}
          </div>
          <div class="flex justify-end space-x-3">
            <button
              class="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg"
              @click="closeConfirmation"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm"
              @click="handleConfirmAction"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
