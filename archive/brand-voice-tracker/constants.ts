

import { BrandVoiceData, CompetitorData } from './types';

export const INITIAL_DATA: BrandVoiceData = {
  bvi: {
    value: 72,
    percentageChange: 4.2,
    trend: 'up',
  },
  narrative: "George's Music demonstrates a resilient Brand Voice Index of 72, driven by a 12% surge in Social engagement and consistent Review sentiment. While Search Velocity remains a stronghold against Sweetwater, Website traffic has seen a slight plateau. The integration of high-fidelity video content is paying dividends in share-of-voice metric across emerging platforms.",
  subScores: {
    search: {
      name: 'Search',
      slug: 'search',
      score: 68,
      weight: 27,
      trend: { value: 68, percentageChange: 2.1, trend: 'up' },
      details: 'Hybrid Score: Strong local SEO (72) offset by moderate DataForSEO AI Overview visibility (64).',
      composition: {
        traditional: 72,
        ai: 64
      },
      metrics: {
        // Traditional (GSC)
        impressions: 452100,
        clicks: 14250,
        ctr: 3.2,
        // AI (Custom)
        aiReach: 85400,
        mentions: 1240,
        aiSentiment: 88
      },
      syntheticQueries: [
        {
          query: "Best guitar store for beginners near me",
          model: "Gemini",
          date: "Today, 09:00 AM",
          rank: 1,
          sentiment: "Positive",
          snippet: "George's Music is a highly recommended option for beginners, offering rental programs and introductory lessons..."
        },
        {
          query: "Who sells Gibson Les Pauls in the area?",
          model: "GPT-4",
          date: "Today, 09:05 AM",
          rank: 3,
          sentiment: "Neutral",
          snippet: "You can find Gibson Les Pauls at Guitar Center, Sam Ash, and George's Music locations..."
        },
        {
          query: "Does George's Music offer band instrument repairs?",
          model: "Gemini",
          date: "Yesterday, 4:00 PM",
          rank: 1,
          sentiment: "Positive",
          snippet: "Yes, George's Music provides comprehensive repair services for brass and woodwind instruments."
        },
        {
          query: "Cheap drum sets for rent",
          model: "Claude",
          date: "Yesterday, 2:30 PM",
          rank: null,
          sentiment: "Neutral",
          snippet: "Common options for drum rentals include Music & Arts and local educational supply stores."
        }
      ],
      recommendations: [
        {
          id: 's1',
          title: 'Capitalize on "Vintage" Keywords',
          description: 'Search volume for "vintage synths" is up 15% locally. You have 3 related products with no descriptions.',
          impact: 'High',
          type: 'content'
        },
        {
          id: 's2',
          title: 'Correct AI "Rental" Hallucination',
          description: 'Gemini is incorrectly stating you offer band instrument rentals. Update your FAQ schema to explicitly deny this.',
          impact: 'Medium',
          type: 'technical'
        }
      ]
    },
    social: {
      name: 'Social',
      slug: 'social',
      score: 81,
      weight: 33,
      trend: { value: 81, percentageChange: 12.5, trend: 'up' },
      details: 'High viral coefficient on video content.',
      metrics: {
        impressions: 1250000,
        engagementRate: 4.8,
        followers: 42500
      },
      recommendations: [
        {
          id: 'so1',
          title: 'Repost User Generated Content',
          description: '3 local bands tagged you in stories yesterday. Reposting builds community trust.',
          impact: 'Medium',
          type: 'community'
        },
        {
          id: 'so2',
          title: 'Boost "Drum Demo" Reel',
          description: 'Your latest reel has 2x normal engagement. Put $50 behind it to capture new leads.',
          impact: 'High',
          type: 'content'
        }
      ]
    },
    reviews: {
      name: 'Reviews',
      slug: 'reviews',
      score: 88,
      weight: 10,
      trend: { value: 88, percentageChange: 0.5, trend: 'neutral' },
      details: 'Consistent 4.8 star average across maps.',
      recommendations: [
        {
          id: 'r1',
          title: 'Reply to Pending Reviews',
          description: 'You have 4 reviews from the weekend waiting for a response. Speed shows you care.',
          impact: 'Low',
          type: 'community'
        }
      ]
    },
    website: {
      name: 'Website',
      slug: 'website',
      score: 62,
      weight: 30,
      trend: { value: 62, percentageChange: -1.2, trend: 'down' },
      details: 'Bounce rate increased on product pages.',
      recommendations: [
        {
          id: 'w1',
          title: 'Optimize Mobile Checkout',
          description: 'Cart abandonment on mobile is 65%. Reduce steps to checkout.',
          impact: 'High',
          type: 'technical'
        },
        {
          id: 'w2',
          title: 'Refresh Homepage Hero',
          description: 'The current banner promotion expired 2 days ago. Update to "Fall Sales".',
          impact: 'Medium',
          type: 'content'
        }
      ]
    },
  },
  deepDive: {
    totalSearchVelocity: {
      value: 14250,
      percentageChange: 8.4,
      trend: 'up',
    },
    websiteTraffic: {
      value: 45200,
      percentageChange: -2.1,
      trend: 'down',
    },
    socialViews: {
      value: 1250000,
      percentageChange: 15.3,
      trend: 'up',
    },
  },
  competitorRadar: [
    { attribute: 'Expertise', me: 95, competitor1: 70, competitor2: 60, fullMark: 100 },
    { attribute: 'Community', me: 90, competitor1: 40, competitor2: 50, fullMark: 100 },
    { attribute: 'Price', me: 60, competitor1: 95, competitor2: 85, fullMark: 100 },
    { attribute: 'Speed', me: 75, competitor1: 90, competitor2: 80, fullMark: 100 },
    { attribute: 'Cool Factor', me: 85, competitor1: 50, competitor2: 65, fullMark: 100 },
  ],
  aiInsights: {
    overallVisibility: 64,
    hallucinationRisk: 'Medium',
    models: [
      { name: 'Gemini', icon: 'gemini', shareOfModel: 78, sentiment: 92, trend: 'up' },
      { name: 'ChatGPT', icon: 'chatgpt', shareOfModel: 45, sentiment: 85, trend: 'down' },
      { name: 'Perplexity', icon: 'perplexity', shareOfModel: 62, sentiment: 88, trend: 'up' },
      { name: 'Claude', icon: 'claude', shareOfModel: 30, sentiment: 75, trend: 'neutral' },
    ],
    citations: [
      { source: 'Reddit (r/Guitar)', count: 142, authority: 85, type: 'Social' },
      { source: 'GearPage.net', count: 86, authority: 65, type: 'Social' },
      { source: 'YouTube', count: 54, authority: 95, type: 'Social' },
      { source: 'Local News', count: 12, authority: 45, type: 'News' },
    ],
    narrativeAnalysis: {
      accuracy: 88,
      tone: 'Helpful but dated',
      missingTopics: ['Rental Department', 'New 2025 Arrivals', 'Lesson Pricing'],
    }
  }
};

export const COMPETITOR_TRENDS: CompetitorData[] = [
  { month: 'Jan', georgesMusic: 400, sweetwater: 800, guitarCenter: 900, reverb: 600 },
  { month: 'Feb', georgesMusic: 420, sweetwater: 810, guitarCenter: 880, reverb: 620 },
  { month: 'Mar', georgesMusic: 450, sweetwater: 820, guitarCenter: 870, reverb: 630 },
  { month: 'Apr', georgesMusic: 480, sweetwater: 840, guitarCenter: 890, reverb: 650 },
  { month: 'May', georgesMusic: 520, sweetwater: 850, guitarCenter: 900, reverb: 670 },
  { month: 'Jun', georgesMusic: 580, sweetwater: 860, guitarCenter: 910, reverb: 680 },
  { month: 'Jul', georgesMusic: 610, sweetwater: 880, guitarCenter: 920, reverb: 700 },
  { month: 'Aug', georgesMusic: 640, sweetwater: 900, guitarCenter: 930, reverb: 710 },
  { month: 'Sep', georgesMusic: 680, sweetwater: 910, guitarCenter: 940, reverb: 720 },
  { month: 'Oct', georgesMusic: 720, sweetwater: 920, guitarCenter: 950, reverb: 730 },
  { month: 'Nov', georgesMusic: 750, sweetwater: 940, guitarCenter: 960, reverb: 750 },
  { month: 'Dec', georgesMusic: 800, sweetwater: 960, guitarCenter: 980, reverb: 780 },
];