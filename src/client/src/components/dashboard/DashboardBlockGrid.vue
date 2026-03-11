<script setup lang="ts">
import { computed } from 'vue';
import DashboardBlockSkeleton from './DashboardBlockSkeleton.vue';
import BrandPulseBlock from './blocks/BrandPulseBlock.vue';
import MerBlock from './blocks/MerBlock.vue';
import AcquisitionCheckBlock from './blocks/AcquisitionCheckBlock.vue';
import SalesPulseBlock from './blocks/SalesPulseBlock.vue';
import AudienceGrowthBlock from './blocks/AudienceGrowthBlock.vue';
import PaidReachBlock from './blocks/PaidReachBlock.vue';
import SearchVisibilityBlock from './blocks/SearchVisibilityBlock.vue';
import ReachBreakdownBlock from './blocks/ReachBreakdownBlock.vue';
import SiteTrafficBlock from './blocks/SiteTrafficBlock.vue';

interface MaxAccount {
  id: string;
  shopifyId: string | null;
}

const props = defineProps<{
  data: any;
  loading: boolean;
  account: MaxAccount | null;
}>();

const blockComponentMap: Record<string, any> = {
  brandPulse: BrandPulseBlock,
  mer: MerBlock,
  acquisitionCheck: AcquisitionCheckBlock,
  salesPulse: SalesPulseBlock,
  audienceGrowth: AudienceGrowthBlock,
  paidReach: PaidReachBlock,
  searchVisibility: SearchVisibilityBlock,
  reachBreakdown: ReachBreakdownBlock,
  siteTraffic: SiteTrafficBlock,
};

const SHOPIFY_ORDER = [
  'brandPulse', 'mer', 'acquisitionCheck', 'salesPulse',
  'audienceGrowth', 'reachBreakdown', 'siteTraffic',
];

const BRAND_ORDER = [
  'brandPulse', 'audienceGrowth', 'paidReach', 'searchVisibility',
  'reachBreakdown', 'siteTraffic',
];

const templatePreset = computed(() => {
  return props.account?.shopifyId ? 'shopify' : 'brand';
});

const visibleBlocks = computed(() => {
  const order = templatePreset.value === 'shopify' ? SHOPIFY_ORDER : BRAND_ORDER;
  return order.filter(id => {
    // Only show blocks that have data (non-null)
    if (props.data?.blocks && props.data.blocks[id] === null) return false;
    return true;
  });
});
</script>

<template>
  <div class="mb-8">
    <!-- Loading State -->
    <div v-if="loading && !data" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DashboardBlockSkeleton v-for="i in 6" :key="i" />
    </div>

    <!-- Blocks Grid -->
    <div v-else-if="data?.blocks" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <component
        v-for="blockId in visibleBlocks"
        :key="blockId"
        :is="blockComponentMap[blockId]"
        :data="data.blocks[blockId]"
      />
    </div>
  </div>
</template>
