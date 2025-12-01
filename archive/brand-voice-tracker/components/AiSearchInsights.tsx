

import React from 'react';
import { BrandVoiceData, AiModelMetric, AiCitation } from '../types';
import { DesignMode } from './BrandVoiceTracker';
import { 
  Bot, 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BrainCircuit,
  Share2,
  ExternalLink,
  MessageSquare,
  Search,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface Props {
  data: BrandVoiceData;
  mode: DesignMode;
  embedded?: boolean; // New prop to hide hero header if embedded
}

const ModelCard = ({ model, mode }: { model: AiModelMetric, mode: DesignMode }) => {
  const isFocus = mode === 'focus';
  
  // Color mapping for models
  const colors: Record<string, string> = {
    'Gemini': '#3b82f6', // Blue
    'ChatGPT': '#10a37f', // Green
    'Perplexity': '#334155', // Slate
    'Claude': '#d97706', // Amber
  };
  
  const color = colors[model.name] || '#6366f1';

  if (isFocus) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
         <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
               <h4 className="font-bold text-slate-900">{model.name}</h4>
            </div>
            {model.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
            {model.trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500" />}
            {model.trend === 'neutral' && <Minus className="w-4 h-4 text-slate-400" />}
         </div>
         
         <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>Share of Model</span>
                <span>{model.shareOfModel}%</span>
              </div>
              <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${model.shareOfModel}%`, backgroundColor: color }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>Sentiment Score</span>
                <span>{model.sentiment}/100</span>
              </div>
              <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-slate-800 transition-all duration-1000" 
                  style={{ width: `${model.sentiment}%` }}
                ></div>
              </div>
            </div>
         </div>
      </div>
    );
  }

  // Executive Mode
  return (
    <div className="bg-slate-900 border border-slate-700 p-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-20">
         <Bot className="w-8 h-8 text-white" />
      </div>
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h4 className="font-mono font-bold text-amplify-green uppercase">{model.name}</h4>
        <span className={`text-xs font-mono ${model.trend === 'up' ? 'text-amplify-green' : 'text-slate-500'}`}>
          {model.trend === 'up' ? '▲' : '▼'} TREND
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 relative z-10">
         <div className="bg-slate-950 p-2 border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono">VISIBILITY</div>
            <div className="text-white font-mono font-bold">{model.shareOfModel}%</div>
         </div>
         <div className="bg-slate-950 p-2 border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono">SENTIMENT</div>
            <div className="text-white font-mono font-bold">{model.sentiment}</div>
         </div>
      </div>
    </div>
  );
};

const CitationRow = ({ citation, mode }: { citation: AiCitation, mode: DesignMode }) => {
  const isFocus = mode === 'focus';
  
  if (isFocus) {
    return (
      <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
        <div className="flex items-center gap-4">
           <div className={`p-2 rounded-lg ${
             citation.type === 'Social' ? 'bg-indigo-100 text-indigo-600' :
             citation.type === 'News' ? 'bg-rose-100 text-rose-600' :
             'bg-slate-200 text-slate-600'
           }`}>
             {citation.type === 'Social' ? <MessageSquare className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
           </div>
           <div>
             <h4 className="font-bold text-slate-900 text-sm">{citation.source}</h4>
             <p className="text-xs text-slate-500">Domain Authority: {citation.authority}</p>
           </div>
        </div>
        <div className="text-right">
           <div className="font-black text-slate-900">{citation.count}</div>
           <div className="text-xs text-slate-500">Citations</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border-b border-slate-800 hover:bg-slate-800/30 transition-colors font-mono text-sm">
      <div className="flex items-center gap-4">
         <span className={`text-xs uppercase px-2 py-0.5 border ${
            citation.type === 'Social' ? 'border-amplify-secondary text-amplify-secondary' : 'border-rose-500 text-rose-500'
         }`}>
           {citation.type}
         </span>
         <span className="text-slate-300">{citation.source}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-slate-500 text-xs">DA:{citation.authority}</span>
        <span className="text-amplify-green font-bold">[{citation.count}]</span>
      </div>
    </div>
  );
};

const AiSearchInsights: React.FC<Props> = ({ data, mode, embedded = false }) => {
  const isFocus = mode === 'focus';
  const { aiInsights } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Hero Section: Overall AI Visibility - Only show if NOT embedded, or show simplified if embedded */}
      {!embedded && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Score Card */}
         <div className={`${isFocus ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl' : 'bg-slate-900 border border-amplify-green'} rounded-[2.5rem] p-8 lg:col-span-1 relative overflow-hidden flex flex-col justify-between min-h-[300px]`}>
            {/* Background Effects */}
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <BrainCircuit className="w-32 h-32" />
            </div>
            {!isFocus && <div className="absolute inset-0 bg-[linear-gradient(rgba(195,253,52,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(195,253,52,0.05)_1px,transparent_1px)] bg-[length:20px_20px]"></div>}

            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-4">
                  <Sparkles className={`w-5 h-5 ${isFocus ? 'text-indigo-200' : 'text-amplify-green'}`} />
                  <h3 className={`text-sm font-bold uppercase tracking-widest ${isFocus ? 'text-indigo-100' : 'text-amplify-green font-mono'}`}>
                    AI Visibility Index
                  </h3>
               </div>
               
               <div className="flex items-baseline gap-2 mb-2">
                 <span className={`text-7xl font-black tracking-tighter ${!isFocus && 'font-mono'}`}>
                   {aiInsights.overallVisibility}%
                 </span>
               </div>
               <p className={`text-sm opacity-80 ${!isFocus && 'font-mono'}`}>
                 Probability of your brand appearing in generative AI responses for category keywords.
               </p>
            </div>

            <div className="relative z-10 mt-8">
               <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                 aiInsights.hallucinationRisk === 'Low' ? 'bg-emerald-500/20 text-emerald-100' :
                 aiInsights.hallucinationRisk === 'Medium' ? 'bg-amber-500/20 text-amber-100' :
                 'bg-rose-500/20 text-rose-100'
               } backdrop-blur-md`}>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-bold text-sm">
                    Hallucination Risk: {aiInsights.hallucinationRisk}
                  </span>
               </div>
               <p className="text-xs mt-2 opacity-60">
                 Models occasionally invent "Rental" services you do not offer.
               </p>
            </div>
         </div>

         {/* Model Breakdown Grid */}
         <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aiInsights.models.map((model) => (
              <ModelCard key={model.name} model={model} mode={mode} />
            ))}
         </div>
      </div>
      )}

      {/* Embedded View: Just show models grid if embedded, skipping the big hero score card as it's redundant with parent view */}
      {embedded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiInsights.models.map((model) => (
            <ModelCard key={model.name} model={model} mode={mode} />
          ))}
        </div>
      )}

      {/* Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Citation Sources (Where AIs learn about you) */}
        <div className={`lg:col-span-2 ${isFocus ? 'bg-white border border-stone-100 shadow-lg' : 'bg-slate-900 border border-slate-800'} rounded-[2.5rem] p-8`}>
           <div className="flex items-center gap-3 mb-6">
              <Share2 className={`w-6 h-6 ${isFocus ? 'text-slate-400' : 'text-amplify-green'}`} />
              <div>
                <h3 className={`text-xl font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono uppercase'}`}>
                   Citation Ecosystem
                </h3>
                <p className={`text-xs ${isFocus ? 'text-slate-500' : 'text-slate-500 font-mono'}`}>
                   Top sources feeding AI knowledge about your brand.
                </p>
              </div>
           </div>
           
           <div className="space-y-2">
              {aiInsights.citations.map((citation, idx) => (
                <CitationRow key={idx} citation={citation} mode={mode} />
              ))}
           </div>
           
           <div className={`mt-6 pt-6 border-t ${isFocus ? 'border-stone-100' : 'border-slate-800'}`}>
              <h4 className={`text-sm font-bold mb-3 ${isFocus ? 'text-slate-900' : 'text-white font-mono'}`}>Optimization Tip:</h4>
              <div className={`p-4 rounded-xl flex gap-3 ${isFocus ? 'bg-amber-50 text-amber-800' : 'bg-slate-950 border border-amplify-green/30 text-amplify-green font-mono text-xs'}`}>
                 <Zap className="w-5 h-5 shrink-0" />
                 <p className="text-sm font-medium">
                   Gemini relies heavily on <strong>Reddit (r/Guitar)</strong> for sentiment. Your "Rental Department" hallucination stems from a 2019 thread. Engage there to correct the record.
                 </p>
              </div>
           </div>
        </div>

        {/* Narrative Analysis (The "AI Mirror") */}
        <div className={`lg:col-span-1 ${isFocus ? 'bg-stone-900 text-white' : 'bg-slate-950 border border-slate-800'} rounded-[2.5rem] p-8 flex flex-col`}>
           <div className="flex items-center gap-3 mb-6">
              <Bot className={`w-6 h-6 ${isFocus ? 'text-indigo-400' : 'text-amplify-green'}`} />
              <h3 className={`text-xl font-bold ${isFocus ? 'text-white' : 'text-white font-mono uppercase'}`}>
                 The AI Mirror
              </h3>
           </div>
           
           <div className="flex-1 space-y-6">
              <div>
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2">Perceived Tone</label>
                 <div className={`text-2xl font-bold ${isFocus ? 'text-indigo-300' : 'text-amplify-green font-mono'}`}>
                   "{aiInsights.narrativeAnalysis.tone}"
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2">Accuracy Score</label>
                 <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-white">{aiInsights.narrativeAnalysis.accuracy}%</span>
                    <span className="text-sm text-slate-500 mb-1">verifiable facts</span>
                 </div>
                 <div className="h-2 w-full bg-white/10 rounded-full mt-2">
                    <div className={`h-full rounded-full ${isFocus ? 'bg-indigo-500' : 'bg-amplify-green'}`} style={{ width: `${aiInsights.narrativeAnalysis.accuracy}%` }}></div>
                 </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Missing from AI Knowledge</label>
                 <ul className="space-y-2">
                    {aiInsights.narrativeAnalysis.missingTopics.map((topic, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                         <AlertTriangle className="w-3 h-3 text-amber-500" />
                         {topic}
                      </li>
                    ))}
                 </ul>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AiSearchInsights;