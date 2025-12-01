export type TrendDirection = 'up' | 'down' | 'neutral';

export interface MetricTrend {
  value: number;
  percentageChange: number;
  trend: TrendDirection;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  type: 'content' | 'technical' | 'community';
}

export interface ChannelMetrics {
  impressions?: number;
  clicks?: number;
  ctr?: number;
  aiReach?: number;
  mentions?: number;
  aiSentiment?: number;
  engagementRate?: number;
  followers?: number;
}

export interface SyntheticQuery {
  query: string;
  model: 'Gemini' | 'GPT-4' | 'Claude';
  date: string;
  rank: number | null;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  snippet: string;
}

export interface SubScore {
  name: string;
  slug: string;
  score: number;
  weight: number;
  trend: MetricTrend;
  details: string;
  recommendations: Recommendation[];
  composition?: {
    traditional: number;
    ai: number;
  };
  metrics?: ChannelMetrics;
  syntheticQueries?: SyntheticQuery[];
}

export interface AiModelMetric {
  name: string;
  icon: string;
  shareOfModel: number;
  sentiment: number;
  trend: TrendDirection;
}

export interface AiCitation {
  source: string;
  count: number;
  authority: number;
  type: 'Social' | 'News' | 'Directory' | 'Blog';
}

export interface AiInsightData {
  overallVisibility: number;
  hallucinationRisk: 'Low' | 'Medium' | 'High';
  models: AiModelMetric[];
  citations: AiCitation[];
  narrativeAnalysis: {
    accuracy: number;
    tone: string;
    missingTopics: string[];
  };
}

export interface BrandVoiceData {
  bvi: MetricTrend;
  narrative: string;
  subScores: {
    search: SubScore;
    social: SubScore;
    reviews: SubScore;
    website: SubScore;
  };
  deepDive: {
    totalSearchVelocity: MetricTrend;
    websiteTraffic: MetricTrend;
    socialViews: MetricTrend;
  };
  competitorRadar: RadarDataPoint[];
  aiInsights: AiInsightData;
}

export interface CompetitorData {
  month: string;
  georgesMusic: number;
  sweetwater: number;
  guitarCenter: number;
  reverb: number;
}

export interface RadarDataPoint {
  attribute: string;
  me: number;
  competitor1: number;
  competitor2: number;
  fullMark: number;
}
