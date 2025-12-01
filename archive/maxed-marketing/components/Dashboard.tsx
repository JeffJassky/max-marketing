import React from 'react';
import { CustomerProfile, InsightCardData } from '../types';
import { OpportunityCard } from './OpportunityCard';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
  customer: CustomerProfile;
  insights: InsightCardData[];
  resolvedInsightIds: string[];
  onNavigateToSuite: (insightId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ customer, insights, resolvedInsightIds, onNavigateToSuite }) => {
  
  // Filter out items that have been resolved
  const visibleInsights = insights.filter(insight => !resolvedInsightIds.includes(insight.id));
  const hasWasteAlert = visibleInsights.some(i => i.type === 'WASTE');

  const handleCardAction = (id: string) => {
    if (id === 'waste-001') {
      // For the specific demo flow, clicking the action on dashboard takes them to the suite
      // unless resolved inline. For this prototype, let's navigate them for deeper context
      onNavigateToSuite(id); 
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Good Morning, {customer.name}
        </h1>
        {hasWasteAlert && (
          <p className="text-slate-600 mt-3 text-lg border-l-4 border-orange-500 pl-4 py-1 bg-orange-50 rounded-r-lg max-w-3xl">
            Today, your highest leverage action is fixing the <span className="font-bold text-slate-900">Google Ads Negative Keyword</span>, which could save you <span className="font-bold text-green-700">$420/mo</span>.
          </p>
        )}
        {!hasWasteAlert && (
             <p className="text-slate-600 mt-3 text-lg pl-4 py-1 max-w-3xl">
                Great job! You've tackled your high-priority items for today.
             </p>
        )}
      </motion.div>

      {/* Stats Summary Strip (Quick Health Check) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Ad Spend', value: '$2,405', change: '+12%', good: false },
          { label: 'Conversion Rate', value: '3.2%', change: '+0.4%', good: true },
          { label: 'Social Engagement', value: '1,240', change: '+18%', good: true },
          { label: 'Local Search Views', value: '850', change: '-5%', good: false },
        ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <div className="flex items-baseline mt-1 space-x-2">
                <h4 className="text-2xl font-bold text-slate-900">{stat.value}</h4>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${stat.good ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stat.change}
                </span>
              </div>
            </motion.div>
        ))}
      </div>

      {/* Main Opportunity Feed */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <span className="w-2 h-8 bg-orange-500 rounded-full mr-3"></span>
          Priority Actions
        </h2>
        <span className="text-sm text-slate-500">{visibleInsights.length} pending items</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence>
            {visibleInsights.map((insight) => (
            <OpportunityCard 
                key={insight.id} 
                data={insight} 
                onAction={handleCardAction}
            />
            ))}
        </AnimatePresence>
        
        {visibleInsights.length === 0 && (
             <div className="col-span-full p-12 bg-white rounded-xl border border-slate-200 text-center">
                <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
                <p className="text-slate-500">Check back later for more AI-driven insights.</p>
             </div>
        )}
      </div>
      
      {/* "Coming Soon" Teaser Area to Fill Space */}
      <div className="mt-12 p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center text-center">
        <div className="bg-slate-100 p-3 rounded-full mb-4">
           <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
           </svg>
        </div>
        <h3 className="text-slate-900 font-semibold">AI Analysis in Progress</h3>
        <p className="text-slate-500 max-w-md mt-2">
          Our system is currently analyzing your Local SEO performance for the Jacksonville store. Check back in 2 hours for new insights.
        </p>
      </div>
    </div>
  );
};