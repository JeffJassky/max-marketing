import { InsightCardData, ActionLog, GoogleAdsFullReport, GoogleAdsSubView } from '../types';

export const GoogleAdsService = {
  /**
   * Existing Legacy Service (Kept for Dashboard compatibility)
   */
  getNegativeKeywordReport: async (client_id: string): Promise<{ insight: InsightCardData, logs: ActionLog[] }> => {
    // Simulate network latency typical of a data lake query
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      insight: {
        id: 'waste-001',
        type: 'WASTE',
        category: 'Google Ads',
        title: 'Google Ads Waste Detected',
        description: 'We found that the keyword "cheap electric guitars" is driving traffic but resulting in zero sales. Users are bouncing because your inventory focuses on premium brands like Fender and Gibson.',
        impactLabel: 'Save $420/mo',
        metrics: [
          { label: 'Spend (30d)', value: '$420.50', color: 'text-red-600' },
          { label: 'Bounce Rate', value: '92%', trend: 'up', trendValue: '+15%' },
          { label: 'ROAS', value: '0.0x', color: 'text-red-600' }
        ],
        actionLabel: 'Block this Word'
      },
      logs: [] // Returns empty log history initially
    };
  },

  /**
   * New Service: Full Suite Data Fetcher
   * Returns data for all 5 Clusters (A, B, C, D, E)
   */
  getFullSuiteReport: async (client_id: string): Promise<GoogleAdsFullReport> => {
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 1200));

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
        negativeKeywords: [
           { id: 'nk1', searchTerm: 'cheap electric guitars', matchType: 'Broad', campaignName: 'Guitars - High End', spend: '$420.50', conversions: 0, clicks: 185, potentialSavings: '$420.50', intentTag: 'Free Seeker', confidenceScore: 95, confidenceLevel: 'High' },
           { id: 'nk2', searchTerm: 'how to fix broken drum', matchType: 'Phrase', campaignName: 'Drums - Sales', spend: '$85.20', conversions: 0, clicks: 42, potentialSavings: '$85.20', intentTag: 'Job Seeker', confidenceScore: 88, confidenceLevel: 'High' },
           { id: 'nk3', searchTerm: 'guitar center hours', matchType: 'Broad', campaignName: 'Local Store', spend: '$115.00', conversions: 0, clicks: 55, potentialSavings: '$115.00', intentTag: 'Competitor', confidenceScore: 75, confidenceLevel: 'Medium' },
           { id: 'nk4', searchTerm: 'free sheet music pdf', matchType: 'Broad', campaignName: 'Accessories', spend: '$32.00', conversions: 0, clicks: 20, potentialSavings: '$32.00', intentTag: 'Free Seeker', confidenceScore: 92, confidenceLevel: 'High' }
        ],
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
            { id: 'k2', keyword: 'synthesizer repair DIY', campaign: 'Synths', spend: '$41.00', cpa: '-', roas: '0.0x', qs: 4, issue: 'Zero Conversions', confidenceLevel: 'Medium' },
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
                components: [{ component: 'Landing Page Exp', status: 'Below Average' }, { component: 'Ad Relevance', status: 'Average' }, { component: 'Expected CTR', status: 'Average' }],
                costPenalty: '$210/mo',
                campaign: 'Audio Gear'
            },
            { 
                id: 'qs2', 
                keyword: 'gibson acoustic', 
                score: 5, 
                components: [{ component: 'Ad Relevance', status: 'Below Average' }, { component: 'Landing Page Exp', status: 'Above Average' }, { component: 'Expected CTR', status: 'Average' }],
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
            { channel: 'YouTube', spend: '$50', roas: '0.0x', conversionValue: '$0', percentage: 5, isInferred: true },
        ],
        alternatives: [
            { pmaxCampaign: 'PMax - All Products', suggestedSplit: { searchStructure: 'Brand + Non-Brand Search', shoppingStructure: 'Standard Shopping (High Margin)' }, projectedEfficiencyGain: '+15% ROAS' }
        ]
      }
    };
  }
};