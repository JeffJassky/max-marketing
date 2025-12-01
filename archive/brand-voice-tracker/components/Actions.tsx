
import React, { useState } from 'react';
import { BrandVoiceData } from '../types';
import { generateNarrative } from '../services/geminiService';
import { RefreshCw, CheckCircle, AlertTriangle, Sparkles, Terminal, Command, Search, Award, Share2, Copy } from 'lucide-react';
import { DesignMode } from './BrandVoiceTracker';

interface Props {
  data: BrandVoiceData;
  onUpdateNarrative: (text: string) => void;
  mode: DesignMode;
}

const Actions: React.FC<Props> = ({ data, onUpdateNarrative, mode }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | null, text: string}>({ type: null, text: '' });
  const isFocus = mode === 'focus';

  // Logic for Win Card
  const bestMetric = {
    label: 'Social Views',
    value: '+15.3%',
    context: 'You are viral this week!',
    color: 'from-pink-500 to-purple-600'
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setMessage({ type: null, text: '' });
    try {
      const newNarrative = await generateNarrative(data);
      onUpdateNarrative(newNarrative);
      setMessage({ type: 'success', text: isFocus ? 'Narrative updated successfully.' : 'PROTOCOL_COMPLETE: DATABASE_UPDATED' });
    } catch (e) {
      setMessage({ type: 'error', text: isFocus ? 'Failed to update narrative.' : 'ERROR: CONNECTION_REFUSED' });
    } finally {
      setLoading(false);
    }
  };

  if (isFocus) {
    // Focus Mode Design
    return (
      <div className="space-y-8 max-w-4xl">
        
        {/* The Win Card Generator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-lg flex flex-col justify-between">
              <div>
                 <div className="flex items-center gap-2 text-amplify-purple font-bold mb-4">
                    <Award className="w-5 h-5" />
                    <h3>Weekly Win Card</h3>
                 </div>
                 <p className="text-slate-500 mb-6">
                   Generate a beautifully designed graphic of your top performing metric to share with your team or boss.
                 </p>
                 <button className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Generate Card
                 </button>
              </div>
           </div>
           
           {/* Preview of the Card */}
           <div className="relative group">
              <div className={`aspect-square rounded-[2rem] bg-gradient-to-br ${bestMetric.color} p-8 flex flex-col justify-between text-white shadow-2xl transform rotate-1 transition-transform group-hover:rotate-0`}>
                 <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center font-black">M</div>
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">Weekly Win</span>
                 </div>
                 <div>
                    <div className="text-6xl font-black tracking-tighter mb-2">{bestMetric.value}</div>
                    <div className="text-2xl font-bold opacity-90">{bestMetric.label}</div>
                 </div>
                 <div className="text-sm font-medium opacity-80 border-t border-white/20 pt-4">
                    {bestMetric.context}
                 </div>
              </div>
              
              {/* Overlay Actions */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                 <button className="bg-white text-slate-900 p-3 rounded-full shadow-lg hover:scale-110 transition-transform"><Share2 className="w-5 h-5" /></button>
                 <button className="bg-white text-slate-900 p-3 rounded-full shadow-lg hover:scale-110 transition-transform"><Copy className="w-5 h-5" /></button>
              </div>
           </div>
        </div>

        {/* Narrative Generator */}
        <div className="bg-white rounded-[2.5rem] border border-stone-100 p-10 shadow-xl overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-amplify-purple/10 p-4 rounded-2xl">
                 <Sparkles className="w-8 h-8 text-amplify-purple" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-slate-900">AI Narrative Generator</h2>
                 <p className="text-slate-500">Powered by Gemini 2.5 Flash</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed mb-8 max-w-2xl text-lg">
               Trigger a deep-scan analysis of the latest metrics to regenerate the Brand Voice Index narrative. This will update the executive summary on your dashboard.
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold py-4 px-8 rounded-xl transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? 'Analyzing...' : 'Generate New Narrative'}
              </button>
            </div>

            {message.type && (
              <div className={`mt-8 p-4 rounded-xl flex items-center gap-3 font-medium max-w-lg ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}>
                 {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                 <span>{message.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Executive Mode Design
  return (
    <div className="space-y-6 max-w-4xl font-mono">
      
      {/* Win Card Exec */}
      <div className="bg-slate-900 border border-slate-700 p-1 rounded-sm">
         <div className="bg-slate-950 p-6 border border-slate-800 relative flex justify-between items-center">
            <div>
               <h3 className="text-amplify-green font-bold uppercase tracking-widest text-sm mb-2">Achievement_Unlocked</h3>
               <p className="text-white text-lg">METRIC: SOCIAL_VIEWS >> <span className="text-amplify-green">+15.3%</span></p>
            </div>
            <button className="border border-amplify-green text-amplify-green px-4 py-2 hover:bg-amplify-green hover:text-slate-900 transition-colors uppercase text-xs font-bold tracking-widest flex items-center gap-2">
               <Share2 className="w-4 h-4" /> Broadcast
            </button>
         </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 p-1 rounded-sm">
        <div className="bg-slate-950 p-6 border border-slate-800 relative overflow-hidden">
          {/* Scanlines effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-0"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                 <Terminal className="w-5 h-5 text-amplify-green" />
                 <h2 className="text-lg font-bold text-white uppercase tracking-widest">Command: GENERATE_NARRATIVE</h2>
              </div>
              <span className="text-xs text-slate-500">[AUTH: ADMIN_L1]</span>
            </div>

            <div className="bg-black border border-slate-800 p-4 mb-6 font-mono text-sm text-slate-400">
               <p>> INITIALIZING GEMINI_INTERFACE...</p>
               <p>> CHECKING API_KEY... [OK]</p>
               <p>> LOADING DATA_MODEL... [OK]</p>
               <p className="animate-pulse">> AWAITING USER INPUT_</p>
            </div>

            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-amplify-green text-amplify-green hover:text-slate-900 border border-amplify-green py-4 px-6 text-sm font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 group"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Command className="w-5 h-5" />}
              {loading ? 'PROCESSING...' : 'EXECUTE_PROTOCOL'}
            </button>

            {message.type && (
              <div className={`mt-4 border-l-4 pl-4 py-2 ${
                message.type === 'success' ? 'border-amplify-green text-amplify-green' : 'border-rose-500 text-rose-500'
              }`}>
                 <span className="font-bold">[{message.type === 'success' ? 'SUCCESS' : 'FAILURE'}]:</span> {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Actions;
