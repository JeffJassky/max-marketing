import { InsightCardData, ActionLog, LowPerfKeyword, SearchTermDrift } from '../types';

export const GoogleAdsService = {
  /**
   * API Service: SearchTermViewService
   * 
   * Required GQL Query Fields: 
   *  - segments.search_term
   *  - metrics.cost_micros (must be converted to currency)
   *  - metrics.conversions
   *  - metrics.impressions
   *  - campaign.id
   * 
   * Filter Logic:
   *  - WHERE metrics.cost_micros > 10000000 (e.g., >$10 spend)
   *  - AND metrics.conversions = 0
   *  - AND segments.search_term DOES_NOT_CONTAIN 'brand_term'
   *  - ORDER BY metrics.cost_micros DESC
   * 
   * Data Lake Management:
   *  This data is NOT live. It is aggregated via a nightly Python batch job (Airflow)
   *  that queries the Google Ads API and deposits JSON reports into our data lake (S3/BigQuery).
   *  The frontend queries this simulated data lake service to ensure performance and prevent API rate limits.
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
   * New Service: Cluster A Data Fetcher
   * Fetches data for Low Performing Keywords and Drift Analysis.
   */
  getExtendedOpportunities: async (client_id: string): Promise<{ 
    lowPerfKeywords: LowPerfKeyword[], 
    driftAnalysis: SearchTermDrift 
  }> => {
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      lowPerfKeywords: [
        { id: 'k1', keyword: 'buy drums online cheap', spend: '$145.20', ctr: '0.8%', qualityScore: '3/10' },
        { id: 'k2', keyword: 'free guitar lessons', spend: '$89.50', ctr: '1.2%', qualityScore: '2/10' },
        { id: 'k3', keyword: 'used amps near me', spend: '$62.10', ctr: '2.1%', qualityScore: '4/10' },
        { id: 'k4', keyword: 'synthesizer repair DIY', spend: '$41.00', ctr: '0.5%', qualityScore: '3/10' },
        { id: 'k5', keyword: 'sheet music pdf free', spend: '$38.75', ctr: '1.1%', qualityScore: '2/10' },
      ],
      driftAnalysis: {
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
      }
    };
  }
};