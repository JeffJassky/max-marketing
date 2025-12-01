

import React, { useState, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { INITIAL_DATA } from '../constants';
import DashboardOverview from './DashboardOverview';
import DeepDive from './DeepDive';
import Actions from './Actions';
import ChannelDetail from './ChannelDetail';
import AiSearchInsights from './AiSearchInsights';
import { 
  LayoutDashboard, 
  BarChart2, 
  Zap, 
  Download,
  Bot
} from 'lucide-react';

export type DesignMode = 'focus' | 'executive';

interface OutletContextType {
  mode: DesignMode;
}

const BrandVoiceTracker: React.FC = () => {
  const { mode } = useOutletContext<OutletContextType>();
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-insights' | 'deep-dive' | 'actions'>('overview');
  const [data, setData] = useState(INITIAL_DATA);
  const location = useLocation();

  // Determine if we are on a detail sub-page
  const isDetailPage = location.pathname !== '/brand-voice' && location.pathname !== '/brand-voice/';
  
  // Extract the channel slug if on detail page
  const channelSlug = isDetailPage ? location.pathname.split('/').pop() : null;
  
  // Find the subScore data matching the slug
  const currentSubScore = channelSlug 
    ? Object.values(data.subScores).find(s => s.slug === channelSlug)
    : null;

  const handleUpdateNarrative = (text: string) => {
    setData(prev => ({ ...prev, narrative: text }));
  };

  const handleDownload = () => {
    window.print();
  };

  const isFocus = mode === 'focus';

  if (isDetailPage && currentSubScore) {
    // Pass the full data object so ChannelDetail can access AI insights when viewing Search
    return <ChannelDetail subScore={currentSubScore} data={data} mode={mode} />;
  }

  // Main Dashboard View
  return (
    <div className="animate-fade-in">
      {/* Trial Banner */}
      <div className={`text-xs font-bold py-2 px-4 rounded-lg text-center tracking-wide mb-8 flex items-center justify-center gap-2 mx-auto max-w-2xl transition-all ${
        isFocus 
          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
          : 'bg-slate-900 border border-amplify-green/30 text-amplify-green font-mono shadow-[0_0_15px_rgba(195,253,52,0.1)]'
      }`}>
        <Zap className="w-3 h-3" />
        {isFocus ? (
          <span>TRIAL MODE ACTIVE • Service provided free until end of Q4 2025</span>
        ) : (
          <span>[SYSTEM_NOTICE]: TRIAL_LICENSE_ACTIVE // EXPIRATION: Q4_2025</span>
        )}
      </div>

      {/* Header Action Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className={`text-4xl font-black tracking-tight mb-2 ${isFocus ? 'text-slate-900' : 'text-white font-mono uppercase'}`}>
            {isFocus ? 'Welcome back, Alex.' : '> USER: ALEX_ADMIN'}
          </h1>
          <p className={isFocus ? 'text-slate-500 text-lg' : 'text-slate-500 font-mono text-sm'}>
            {isFocus ? 'Here is your marketing focus for today.' : '[SESSION_ID]: 8473-XJ9 // ESTABLISHING UPLINK...'}
          </p>
        </div>
        <button 
          onClick={handleDownload}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg group ${
            isFocus 
              ? 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-xl' 
              : 'bg-slate-900 border border-amplify-green text-amplify-green hover:bg-amplify-green hover:text-slate-900 font-mono'
          }`}
        >
          <span>{isFocus ? 'Download Report' : 'EXPORT_LOGS'}</span>
          <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-4 mb-8 border-b border-transparent overflow-x-auto pb-2">
        {(['overview', 'ai-insights', 'deep-dive', 'actions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-6 py-3 text-sm font-bold transition-all whitespace-nowrap overflow-hidden shrink-0 group ${
              isFocus 
                ? `rounded-full ${activeTab === tab ? 'bg-amplify-purple text-white shadow-lg shadow-amplify-purple/20' : 'bg-white text-slate-500 hover:bg-stone-100'}`
                : `rounded-none border-b-2 ${activeTab === tab ? 'border-amplify-green text-amplify-green bg-amplify-green/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`
            }`}
          >
            <div className="flex items-center gap-2 relative z-10">
              {tab === 'overview' && <LayoutDashboard className="w-4 h-4" />}
              {tab === 'ai-insights' && <Bot className="w-4 h-4" />}
              {tab === 'deep-dive' && <BarChart2 className="w-4 h-4" />}
              {tab === 'actions' && <Zap className="w-4 h-4" />}
              <span className={!isFocus ? 'uppercase font-mono' : ''}>
                {tab === 'ai-insights' ? 'AI Intelligence' : tab.replace('-', ' ')}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pb-12">
        {activeTab === 'overview' && <DashboardOverview data={data} mode={mode} />}
        {activeTab === 'ai-insights' && <AiSearchInsights data={data} mode={mode} />}
        {activeTab === 'deep-dive' && <DeepDive data={data} mode={mode} />}
        {activeTab === 'actions' && <Actions data={data} onUpdateNarrative={handleUpdateNarrative} mode={mode} />}
      </div>
    </div>
  );
};

export default BrandVoiceTracker;