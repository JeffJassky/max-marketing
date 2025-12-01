

export interface MetricTrend {
  value: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  type: 'content' | 'technical' | 'community';
}

export interface ChannelMetrics {
  // Traditional Search Metrics
  impressions?: number;
  clicks?: number;
  ctr?: number;
  
  // AI Metrics
  aiReach?: number; // Estimated impressions via AI
  mentions?: number;
  aiSentiment?: number;

  // Social/General
  engagementRate?: number;
  followers?: number;
}

export interface SyntheticQuery {
  query: string;
  model: 'Gemini' | 'GPT-4' | 'Claude';
  date: string;
  rank: number | null; // Null if not present
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  snippet: string;
}

export interface SubScore {
  name: string;
  slug: string;
  score: number;
  weight: number; // Percentage (e.g., 33 for 33%)
  trend: MetricTrend;
  details: string;
  recommendations: Recommendation[];
  composition?: {
    traditional: number;
    ai: number;
  };
  metrics?: ChannelMetrics;
  syntheticQueries?: SyntheticQuery[]; // New field for raw data logs
}

export interface AiModelMetric {
  name: string;
  icon: string; // identifier for icon
  shareOfModel: number; // % visibility
  sentiment: number; // 0-100
  trend: 'up' | 'down' | 'neutral';
}

export interface AiCitation {
  source: string;
  count: number;
  authority: number; // Domain Authority approximation
  type: 'Social' | 'News' | 'Directory' | 'Blog';
}

export interface AiInsightData {
  overallVisibility: number; // 0-100
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