import React, { useState } from 'react';
import { ArrowUpRight, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, CheckCircle2, BarChart } from 'lucide-react';
import { InsightCardData } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface OpportunityCardProps {
  data: InsightCardData;
  onAction?: (id: string) => void;
  expanded?: boolean;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ data, onAction, expanded = false }) => {
  const [isResolved, setIsResolved] = useState(false);

  const handleAction = () => {
    if (onAction) {
      onAction(data.id);
    }
    // Simulate instantaneous "Feel Good" UI feedback
    if (data.type === 'WASTE') {
      // Note: In a real app this state might be controlled by parent
      // For this card, we let the parent handle navigation usually, 
      // but if used inline, this handles the visual state.
    }
  };

  if (isResolved) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm h-full min-h-[240px]"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-green-900">Optimization Applied!</h3>
        <p className="text-green-700 mt-2">You've successfully blocked "cheap electric guitars". We estimate this will save you $420 next month.</p>
        <button 
          onClick={() => setIsResolved(false)} // Just for demo reset
          className="mt-6 text-sm text-green-600 font-medium hover:underline"
        >
          Undo (Demo)
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full"
    >
      <div className={`h-1.5 w-full ${data.type === 'WASTE' ? 'bg-red-500' : 'bg-blue-500'}`} />
      
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase
              ${data.type === 'WASTE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}
            `}>
              {data.category}
            </span>
            {data.impactLabel && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                {data.impactLabel}
              </span>
            )}
          </div>
          {data.type === 'WASTE' ? (
            <AlertTriangle className="h-5 w-5 text-red-400" />
          ) : (
            <Lightbulb className="h-5 w-5 text-blue-400" />
          )}
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
          {data.title}
        </h3>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          {data.description}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
          {data.metrics.map((metric, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">{metric.label}</span>
              <div className="flex items-end">
                <span className={`text-sm font-bold ${metric.color || 'text-slate-800'}`}>
                  {metric.value}
                </span>
                {metric.trend && (
                  <span className={`ml-1.5 flex items-center text-xs ${metric.trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                    {metric.trend === 'up' && <TrendingUp className="w-3 h-3 mr-0.5" />}
                    {metric.trend === 'down' && <TrendingDown className="w-3 h-3 mr-0.5" />}
                    {metric.trendValue}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Predicted Engagement Section (Specific for Social Spark) */}
        {data.predictedEngagement && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center">
              <BarChart className="w-3 h-3 mr-1.5" /> Predicted Engagement
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100 text-center">
                <span className="block text-indigo-900 font-bold text-sm">{data.predictedEngagement.reach}</span>
                <span className="block text-[10px] text-indigo-600 font-medium">Reach</span>
              </div>
              <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100 text-center">
                <span className="block text-indigo-900 font-bold text-sm">{data.predictedEngagement.traffic}</span>
                <span className="block text-[10px] text-indigo-600 font-medium">Traffic</span>
              </div>
              <div className="bg-green-50 rounded-lg p-2 border border-green-100 text-center">
                <span className="block text-green-900 font-bold text-sm">{data.predictedEngagement.revenue}</span>
                <span className="block text-[10px] text-green-600 font-medium">Revenue</span>
              </div>
            </div>
          </div>
        )}

        {/* Action */}
        <div className="mt-auto">
          <button 
            onClick={handleAction}
            className={`w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors
              ${data.type === 'WASTE' 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100 hover:shadow-red-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:shadow-indigo-200'}
              shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
            `}
          >
            {data.actionLabel}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};