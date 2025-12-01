

import React, { useState } from 'react';
import { SubScore, BrandVoiceData, SyntheticQuery } from '../types';
import { DesignMode } from './BrandVoiceTracker';
import { ArrowLeft, CheckCircle, Zap, AlertCircle, ArrowRight, BarChart2, Search, Bot, MousePointer, Eye, Percent, MessageCircle, ThumbsUp, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import AiSearchInsights from './AiSearchInsights';

interface Props {
  subScore: SubScore;
  data: BrandVoiceData; // Now receives full data to access AI stats
  mode: DesignMode;
}

// Simulated historical data for this channel
const generateHistory = (score: number) => {
  const data = [];
  let current = score - 10;
  for (let i = 0; i < 30; i++) {
    data.push({
      day: `Day ${i + 1}`,
      value: Math.floor(current + (Math.random() * 10 - 3))
    });
    current += 0.5;
  }
  return data;
};

// Helper for large numbers
const formatNumber = (num: number | undefined) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

const SyntheticQueryRow = ({ query, mode }: { query: SyntheticQuery, mode: DesignMode }) => {
  const isFocus = mode === 'focus';
  const [expanded, setExpanded] = useState(false);

  if (isFocus) {
    return (
      <div className="border-b border-stone-100 last:border-0">
        <div 
          onClick={() => setExpanded(!expanded)}
          className="p-4 hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              query.model === 'Gemini' ? 'bg-blue-100 text-blue-600' :
              query.model === 'GPT-4' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {query.model[0]}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{query.query}</h4>
              <p className="text-xs text-slate-500">{query.date}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              query.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-600' :
              query.sentiment === 'Negative' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
            }`}>
              {query.sentiment}
            </div>
            <div className="text-right w-16">
              <span className="text-xs text-slate-400 block">Rank</span>
              <span className="font-bold text-slate-900">{query.rank ? `#${query.rank}` : '-'}</span>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
        
        {expanded && (
          <div className="bg-stone-50 p-4 pl-16 text-sm text-slate-600 border-t border-stone-100 italic">
            "{query.snippet}"
          </div>
        )}
      </div>
    );
  }

  // Executive Mode Row
  return (
    <div className="border-b border-slate-800 last:border-0 font-mono text-xs">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-3 hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-amplify-green">[{query.model.toUpperCase()}]</span>
          <span className="text-white">{query.query}</span>
        </div>
        <div className="flex items-center gap-4">
           <span className={query.sentiment === 'Positive' ? 'text-amplify-green' : 'text-slate-400'}>
             {query.sentiment.toUpperCase()}
           </span>
           <span className="text-white w-8 text-right">
             {query.rank ? `R:${query.rank}` : 'N/A'}
           </span>
        </div>
      </div>
      {expanded && (
        <div className="bg-slate-950 p-3 text-slate-400 border-l-2 border-slate-700 ml-2 mb-2">
           > {query.snippet}
        </div>
      )}
    </div>
  );
};

const ChannelDetail: React.FC<Props> = ({ subScore, data, mode }) => {
  const isFocus = mode === 'focus';
  const historyData = generateHistory(subScore.score);
  
  // Check if we are in the Search channel to trigger the Hybrid View
  const isSearch = subScore.slug === 'search';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/brand-voice" 
          className={`p-2 rounded-full transition-colors ${isFocus ? 'bg-stone-100 hover:bg-stone-200 text-slate-600' : 'bg-slate-800 hover:bg-amplify-green text-amplify-green hover:text-slate-900'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className={`text-3xl font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono uppercase'}`}>
            {subScore.name} {isSearch && <span className="text-amplify-secondary opacity-80">(Hybrid)</span>} Analysis
          </h1>
          <p className={isFocus ? 'text-slate-500' : 'text-slate-500 font-mono text-xs'}>
            {isSearch 
              ? 'Unified intelligence from Traditional SEO (70%) and Generative AI (30%).' 
              : 'Deep dive metrics and optimization protocols.'}
          </p>
        </div>
      </div>

      {/* SEARCH PERFORMANCE MATRIX (Deep Dive Metrics) */}
      {isSearch && subScore.composition && subScore.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Traditional Pillar */}
          <div className={`p-8 rounded-[2rem] flex flex-col ${isFocus ? 'bg-white border border-stone-100 shadow-lg' : 'bg-slate-900 border border-slate-800'}`}>
             <div className="flex items-center justify-between mb-8 border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${isFocus ? 'bg-blue-50 text-blue-600' : 'bg-slate-800 text-blue-400'}`}>
                     <Search className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className={`font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>Traditional SEO</h3>
                     <p className="text-xs text-slate-500">Google Search Console</p>
                   </div>
                </div>
                <div className="text-right">
                   <div className={`text-4xl font-black ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>{subScore.composition.traditional}</div>
                   <div className="text-xs font-bold text-slate-400">SCORE CONTRIBUTION</div>
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-4 flex-1 items-end">
                <div className={`p-4 rounded-2xl ${isFocus ? 'bg-stone-50' : 'bg-slate-950 border border-slate-800'}`}>
                   <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Impr.</span>
                   </div>
                   <div className={`text-2xl font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>
                     {formatNumber(subScore.metrics.impressions)}
                   </div>
                   <div className="text-xs text-emerald-500 font-bold mt-1">+2.4%</div>
                </div>
                <div className={`p-4 rounded-2xl ${isFocus ? 'bg-stone-50' : 'bg-slate-950 border border-slate-800'}`}>
                   <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <MousePointer className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Clicks</span>
                   </div>
                   <div className={`text-2xl font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>
                     {formatNumber(subScore.metrics.clicks)}
                   </div>
                   <div className="text-xs text-emerald-500 font-bold mt-1">+8.1%</div>
                </div>
                <div className={`p-4 rounded-2xl ${isFocus ? 'bg-stone-50' : 'bg-slate-950 border border-slate-800'}`}>
                   <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <Percent className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">CTR</span>
                   </div>
                   <div className={`text-2xl font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>
                     {subScore.metrics.ctr}%
                   </div>
                   <div className="text-xs text-slate-400 font-bold mt-1">Avg</div>
                </div>
             </div>
          </div>

          {/* AI Pillar */}
          <div className={`p-8 rounded-[2rem] flex flex-col ${isFocus ? 'bg-white border border-stone-100 shadow-lg' : 'bg-slate-900 border border-slate-800'}`}>
             <div className="flex items-center justify-between mb-8 border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${isFocus ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-800 text-amplify-green'}`}>
                     <Bot className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className={`font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>Generative Visibility</h3>
                     <p className="text-xs text-slate-500">Source: DataForSEO API</p>
                   </div>
                </div>
                <div className="text-right">
                   <div className={`text-4xl font-black ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>{subScore.composition.ai}</div>
                   <div className="text-xs font-bold text-slate-400">SCORE CONTRIBUTION</div>
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-4 flex-1 items-end">
                <div className={`p-4 rounded-2xl group relative ${isFocus ? 'bg-indigo-50/50' : 'bg-slate-950 border border-slate-800'}`}>
                   <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <Bot className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Reach</span>
                   </div>
                   <div className={`text-2xl font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>
                     {formatNumber(subScore.metrics.aiReach)}
                   </div>
                   <div className="text-xs text-emerald-500 font-bold mt-1">+12%</div>
                   {/* Tooltip explaining calculation */}
                   <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg text-[10px] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${isFocus ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                      Estimated visibility derived from DataForSEO SERP Volume x AI Overview presence.
                   </div>
                </div>
                <div className={`p-4 rounded-2xl group relative ${isFocus ? 'bg-indigo-50/50' : 'bg-slate-950 border border-slate-800'}`}>
                   <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Mentions</span>
                   </div>
                   <div className={`text-2xl font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>
                     {formatNumber(subScore.metrics.mentions)}
                   </div>
                   <div className="text-xs text-emerald-500 font-bold mt-1">+5.2%</div>
                   <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg text-[10px] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${isFocus ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                      Direct brand citations found within DataForSEO AI Overview text feeds.
                   </div>
                </div>
                <div className={`p-4 rounded-2xl group relative ${isFocus ? 'bg-indigo-50/50' : 'bg-slate-950 border border-slate-800'}`}>
                   <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Sent.</span>
                   </div>
                   <div className={`text-2xl font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>
                     {subScore.metrics.aiSentiment}
                   </div>
                   <div className="text-xs text-slate-400 font-bold mt-1">/ 100</div>
                   <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg text-[10px] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${isFocus ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                      Automated sentiment analysis of text returned by DataForSEO API.
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Synthetic Query Log - The "Meat on the Bone" */}
      {isSearch && subScore.syntheticQueries && (
         <div className={`rounded-[2.5rem] overflow-hidden ${isFocus ? 'bg-white border border-stone-100 shadow-lg' : 'bg-slate-900 border border-slate-800'}`}>
            <div className={`p-8 border-b ${isFocus ? 'border-stone-100' : 'border-slate-800 bg-slate-950'}`}>
               <div className="flex items-center gap-3">
                  <Terminal className={`w-5 h-5 ${isFocus ? 'text-slate-400' : 'text-amplify-green'}`} />
                  <div>
                    <h3 className={`font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono uppercase'}`}>DataForSEO Log</h3>
                    <p className={`text-xs ${isFocus ? 'text-slate-500' : 'text-slate-500 font-mono'}`}>
                       Raw feed of AI Overviews and Labs data fetched via DataForSEO API.
                    </p>
                  </div>
               </div>
            </div>
            <div>
               {subScore.syntheticQueries.map((query, idx) => (
                 <SyntheticQueryRow key={idx} query={query} mode={mode} />
               ))}
            </div>
            <div className={`p-4 text-center text-xs font-bold ${isFocus ? 'bg-stone-50 text-slate-500' : 'bg-slate-950 text-slate-600 font-mono'}`}>
               Showing recent 4 of 50 tracked queries
            </div>
         </div>
      )}

      {/* Chart & Trend - Unified View */}
      <div className={`p-6 md:p-8 rounded-[2.5rem] ${isFocus ? 'bg-white border border-stone-100 shadow-lg' : 'bg-slate-900 border border-slate-800 relative overflow-hidden'}`}>
        <div className="flex justify-between items-end mb-8">
           <div>
             <span className={`text-sm font-bold uppercase tracking-widest ${isFocus ? 'text-slate-400' : 'text-amplify-green font-mono'}`}>
               {isSearch ? 'Unified Velocity Index Trend' : 'Current Score Trend'}
             </span>
             <div className={`text-6xl font-black ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>
               {subScore.score}
             </div>
           </div>
           <div className={`text-right ${!isFocus && 'font-mono'}`}>
             <div className={`text-lg font-bold ${subScore.trend.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {subScore.trend.trend === 'up' ? '+' : ''}{subScore.trend.percentageChange}%
             </div>
             <span className="text-slate-500 text-sm">vs last 30 days</span>
           </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isFocus ? '#6366f1' : '#c3fd34'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isFocus ? '#6366f1' : '#c3fd34'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={isFocus ? '#f5f5f4' : '#1e293b'} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isFocus ? '#fff' : '#0f172a', 
                  borderColor: isFocus ? '#e7e5e4' : '#334155',
                  color: isFocus ? '#000' : '#fff' 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={isFocus ? '#6366f1' : '#c3fd34'} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* The "Next Best Move" Engine */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${isFocus ? 'bg-amplify-purple/10 text-amplify-purple' : 'bg-amplify-green/10 text-amplify-green'}`}>
             <Zap className="w-5 h-5" />
          </div>
          <h2 className={`text-xl font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono uppercase'}`}>
             {isFocus ? 'Recommended Actions' : 'OPTIMIZATION_PROTOCOLS'}
          </h2>
        </div>

        <div className="grid gap-4">
          {subScore.recommendations.map((rec) => (
            <div key={rec.id} className={`group p-6 rounded-3xl transition-all border ${
              isFocus 
                ? 'bg-white border-stone-200 hover:border-amplify-purple hover:shadow-lg' 
                : 'bg-slate-950 border-slate-800 hover:border-amplify-green'
            }`}>
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                
                {/* Impact Badge */}
                <div className={`shrink-0 px-4 py-2 rounded-xl text-center min-w-[100px] ${
                  rec.impact === 'High' 
                    ? (isFocus ? 'bg-rose-50 text-rose-600' : 'bg-rose-900/30 text-rose-500 border border-rose-800')
                    : (isFocus ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/30 text-amber-500 border border-amber-800')
                }`}>
                  <span className="block text-xs font-bold uppercase tracking-wider mb-1">Impact</span>
                  <span className="block font-black text-lg">{rec.impact}</span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 group-hover:underline ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>
                    {rec.title}
                  </h3>
                  <p className={`${isFocus ? 'text-slate-600' : 'text-slate-400 font-mono text-sm'}`}>
                    {rec.description}
                  </p>
                </div>

                {/* Action */}
                <button className={`shrink-0 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                  isFocus 
                    ? 'bg-slate-900 text-white hover:bg-amplify-purple' 
                    : 'bg-transparent border border-amplify-green text-amplify-green hover:bg-amplify-green hover:text-slate-900 font-mono uppercase'
                }`}>
                  <span>Execute</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EMBEDDED AI INSIGHTS (Only for Search) */}
      {isSearch && (
        <div className="mt-12 pt-8 border-t border-stone-200">
           <div className="mb-8">
              <h2 className={`text-2xl font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>Generative Engine Intelligence</h2>
              <p className="text-slate-500">Underlying data powering the AI composition score.</p>
           </div>
           {/* We render the AI component but tell it we are embedded to adjust its layout if needed */}
           <AiSearchInsights data={data} mode={mode} embedded={true} />
        </div>
      )}
    </div>
  );
};

export default ChannelDetail;