import React, { useState, useEffect } from 'react';
import { GoogleAdsSubView, InsightCardData, ActionLog, RoadmapTask, GoogleAdsFullReport, AppView, UserGoal, ConfidenceLevel } from '../types';
import { 
  Search, Ban, CheckCircle, TrendingDown, DollarSign, 
  MousePointer2, Calendar, Check, ArrowRight, Activity, 
  Wallet, Layers, AlertTriangle, ArrowRightLeft, PauseCircle, 
  Layout, ShieldAlert, Sparkles, Sliders, RefreshCw, ChevronDown, Download, MapPin, Smartphone, Wifi, Globe, Target, Info, X, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleAdsService } from '../services/GoogleAdsService';

interface GoogleAdsSuiteProps {
  initialSubView?: GoogleAdsSubView;
  wasteInsight: InsightCardData;
  resolvedInsightIds: string[];
  wasteWatchUnlocked: boolean;
  wasteWatchLog: ActionLog[];
  onResolveInsight: (id: string, logEntry?: ActionLog) => void;
  roadmapTasks: RoadmapTask[];
  onToggleRoadmapTask: (id: string) => void;
}

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, title, children, onConfirm, onCancel, confirmLabel = 'Confirm' }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            >
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                    <div className="text-slate-600 text-sm mb-6">{children}</div>
                    <div className="flex justify-end space-x-3">
                        <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg">Cancel</button>
                        <button onClick={onConfirm} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm">{confirmLabel}</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export const GoogleAdsSuite: React.FC<GoogleAdsSuiteProps> = ({ 
  initialSubView = GoogleAdsSubView.OVERVIEW, 
  wasteWatchLog,
  onResolveInsight,
  roadmapTasks,
  onToggleRoadmapTask
}) => {
  const [activeTab, setActiveTab] = useState<GoogleAdsSubView>(initialSubView);
  const [report, setReport] = useState<GoogleAdsFullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [userGoal, setUserGoal] = useState<UserGoal>('ROAS'); // Toggle between CPA and ROAS focus

  // Selection & Action States
  const [selectedNegatives, setSelectedNegatives] = useState<string[]>([]);
  const [confirmationAction, setConfirmationAction] = useState<{
      type: string;
      title: string;
      description: React.ReactNode;
      onConfirm: () => void;
  } | null>(null);

  // Local state to simulate optimistic updates
  const [blockedNegatives, setBlockedNegatives] = useState<string[]>([]);
  const [pausedKeywords, setPausedKeywords] = useState<string[]>([]);
  const [fixedSettings, setFixedSettings] = useState<string[]>([]);
  const [excludedWaste, setExcludedWaste] = useState<string[]>([]);
  const [retiredAssets, setRetiredAssets] = useState<string[]>([]);

  useEffect(() => {
    setActiveTab(initialSubView);
  }, [initialSubView]);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      try {
        const data = await GoogleAdsService.getFullSuiteReport('client_123');
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [dateRange]); // Mock refresh on date change

  const tabs = [
    { id: GoogleAdsSubView.OVERVIEW, label: 'Overview', icon: Layout },
    { id: GoogleAdsSubView.KEYWORD_INTEL, label: 'Keyword Intel', icon: Search },
    { id: GoogleAdsSubView.WASTE_GUARD, label: 'Waste Guard', icon: ShieldAlert },
    { id: GoogleAdsSubView.CREATIVE_LAB, label: 'Creative Lab', icon: Sparkles },
    { id: GoogleAdsSubView.PMAX_POWER, label: 'PMax Power', icon: Layers },
    { id: GoogleAdsSubView.CAMPAIGN_OPS, label: 'Campaign Ops', icon: Sliders },
    { id: GoogleAdsSubView.ROADMAP, label: 'Roadmap', icon: Calendar },
  ];

  const handleConfirmAction = () => {
      if (confirmationAction) {
          confirmationAction.onConfirm();
          setConfirmationAction(null);
          // In a real app, we'd trigger a toast here
      }
  };

  const executeBlockNegatives = () => {
      const count = selectedNegatives.length;
      setBlockedNegatives([...blockedNegatives, ...selectedNegatives]);
      setSelectedNegatives([]);
      onResolveInsight('bulk_negative_block', { date: new Date().toISOString(), action: `Blocked ${count} negative keywords`, savings: 'Est. $450/mo' });
  };

  const executePauseKeyword = (id: string) => {
      setPausedKeywords([...pausedKeywords, id]);
      onResolveInsight(`pause_${id}`, { date: new Date().toISOString(), action: 'Paused low-performing keyword', savings: 'Est. efficiency gain' });
  };

  if (loading) {
     return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="flex flex-col items-center animate-pulse">
                <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
                <div className="h-4 w-48 bg-slate-200 rounded"></div>
            </div>
        </div>
     );
  }

  if (!report) return <div>Error loading report.</div>;

  return (
    <div className="h-full flex flex-col bg-white min-h-screen">
      
      {/* GLOBAL HEADER */}
      <div className="bg-white border-b border-slate-200 pt-6 pb-0 px-4 md:px-8 sticky top-0 z-30 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                <img src="https://www.gstatic.com/images/branding/product/1x/ads_2022_48dp.png" className="w-8 h-8 mr-3" alt="Ads" />
                Google Ads Suite
            </h1>
            <p className="text-slate-500 text-sm mt-1">
                Connected to: <span className="font-semibold text-slate-700">Account #492-332-1102</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             {/* Goal Toggle */}
             <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold mr-2">
                 <button onClick={() => setUserGoal('CPA')} className={`px-3 py-1.5 rounded-md transition-all ${userGoal === 'CPA' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>Lead Gen (CPA)</button>
                 <button onClick={() => setUserGoal('ROAS')} className={`px-3 py-1.5 rounded-md transition-all ${userGoal === 'ROAS' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>E-com (ROAS)</button>
             </div>

             <div className="relative group">
                <button className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                    {dateRange}
                    <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover:block z-50">
                    {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Year to Date'].map(d => (
                        <button key={d} onClick={() => setDateRange(d)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg">
                            {d}
                        </button>
                    ))}
                </div>
             </div>
             <button className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center bg-slate-100 px-3 py-2 rounded-lg transition-colors">
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Sync
             </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                    flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                    ${isActive 
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'
                    }
                `}
                >
                <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
                </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 bg-slate-50 p-4 md:p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {/* --- TAB 1: OVERVIEW --- */}
          {activeTab === GoogleAdsSubView.OVERVIEW && (
             <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto">
                {/* Scorecards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-slate-500 text-sm font-medium">Optimization Score</span>
                            <Activity className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-4xl font-bold text-slate-900 mb-2 relative z-10">{report.accountHealth.optimizationScore}%</div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative z-10">
                            <div className="bg-gradient-to-r from-orange-400 to-green-500 h-full rounded-full" style={{ width: `${report.accountHealth.optimizationScore}%` }}></div>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
                            <Activity className="w-32 h-32 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex justify-between items-start mb-4">
                            <span className="text-slate-500 text-sm font-medium">Monthly Waste</span>
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-4xl font-bold text-slate-900 mb-2">{report.accountHealth.monthlyWaste}</div>
                        <p className="text-xs text-red-500 font-medium flex items-center"><TrendingDown className="w-3 h-3 mr-1" /> Requires Attention</p>
                    </div>
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex justify-between items-start mb-4">
                            <span className="text-slate-500 text-sm font-medium">PMax Efficiency</span>
                            <Layers className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-4xl font-bold text-slate-900 mb-2">{report.accountHealth.pmaxEfficiency}</div>
                        <p className="text-xs text-slate-500">ROAS (Last 30d)</p>
                    </div>
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex justify-between items-start mb-4">
                            <span className="text-slate-500 text-sm font-medium">Ad Strength</span>
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="text-4xl font-bold text-slate-900 mb-2">{report.accountHealth.adStrength}</div>
                        <p className="text-xs text-slate-500">Avg. Asset Quality</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* Priority Actions */}
                     <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900 flex items-center">
                                <Target className="w-5 h-5 mr-2 text-orange-500" />
                                Top Priority Actions
                            </h3>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold">3 Pending</span>
                        </div>
                        <div className="space-y-4">
                            {report.topPriorityActions.map((action, idx) => (
                                <div key={action.id} 
                                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-indigo-200 hover:shadow-sm transition-all group"
                                    onClick={() => setActiveTab(action.tab)}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 font-bold text-lg ${
                                            idx === 0 ? 'bg-red-100 text-red-600' : idx === 1 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700">{action.title}</p>
                                            <p className="text-xs text-slate-500">{action.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded mr-4 ${
                                            idx === 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                        }`}>
                                            Impact: {action.impact}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>

                     {/* Automation Status */}
                     <div className="bg-indigo-900 rounded-xl p-6 text-white relative overflow-hidden flex flex-col justify-between">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2 flex items-center"><RefreshCw className="w-5 h-5 mr-2 animate-spin-slow" /> Auto-Pilot</h3>
                            <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                                We are actively monitoring <span className="text-white font-bold">14 campaigns</span> for drift, waste, and creative fatigue.
                            </p>
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center text-xs text-indigo-300"><CheckCircle className="w-3 h-3 mr-2 text-green-400" /> Budget Pacing Active</div>
                                <div className="flex items-center text-xs text-indigo-300"><CheckCircle className="w-3 h-3 mr-2 text-green-400" /> Drift Detection On</div>
                                <div className="flex items-center text-xs text-indigo-300"><CheckCircle className="w-3 h-3 mr-2 text-green-400" /> Creative Watch On</div>
                            </div>
                            <button onClick={() => setActiveTab(GoogleAdsSubView.ROADMAP)} className="w-full bg-white text-indigo-900 px-4 py-3 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg">
                                View Roadmap
                            </button>
                        </div>
                        <Sparkles className="absolute -bottom-8 -right-8 w-48 h-48 text-indigo-800 opacity-30 rotate-12" />
                     </div>
                </div>
             </motion.div>
          )}

          {/* --- TAB 2: KEYWORD INTEL (Cluster A) --- */}
          {activeTab === GoogleAdsSubView.KEYWORD_INTEL && (
            <motion.div key="clusterA" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-8">
                
                {/* 1. Negative Keyword Analyzer */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center">
                        <div>
                            <h3 className="font-bold text-slate-900 flex items-center">
                                <Ban className="w-4 h-4 mr-2 text-red-500" /> Negative Keyword Analyzer
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Search terms with high spend & zero value. Select to block.</p>
                        </div>
                        {selectedNegatives.length > 0 && (
                            <button 
                                onClick={() => setConfirmationAction({
                                    type: 'BLOCK_NEGATIVES',
                                    title: `Block ${selectedNegatives.length} Keywords`,
                                    description: `You are about to add ${selectedNegatives.length} negative keywords at the Campaign level. This will stop future spend on these terms.`,
                                    onConfirm: executeBlockNegatives
                                })}
                                className="mt-4 md:mt-0 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm flex items-center animate-in fade-in slide-in-from-bottom-2"
                            >
                                <Ban className="w-4 h-4 mr-2" /> Block {selectedNegatives.length} Terms
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 w-8"><input type="checkbox" className="rounded border-slate-300" /></th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Search Term</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Intent</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Confidence</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Spend (30d)</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Stats</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {report.clusterA.negativeKeywords.filter(nk => !blockedNegatives.includes(nk.id)).map((nk) => (
                                <tr key={nk.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={selectedNegatives.includes(nk.id)}
                                            onChange={(e) => {
                                                if(e.target.checked) setSelectedNegatives([...selectedNegatives, nk.id]);
                                                else setSelectedNegatives(selectedNegatives.filter(id => id !== nk.id));
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-slate-900 block">{nk.searchTerm}</span>
                                        <span className="text-xs text-slate-400">{nk.campaignName} • {nk.matchType}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                                            {nk.intentTag}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${nk.confidenceLevel === 'High' ? 'bg-green-500' : nk.confidenceLevel === 'Medium' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                                            <span className="text-xs text-slate-600 font-medium">{nk.confidenceScore}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">{nk.spend}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-xs text-slate-500">{nk.clicks} Clicks</div>
                                        <div className="text-xs text-slate-400">0 Conv.</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* 2. Match Drift */}
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 flex items-center">
                                <ArrowRightLeft className="w-4 h-4 mr-2 text-blue-500" /> Match Type Drift
                            </h3>
                            <span className="text-xs text-slate-400">Broad Match analysis</span>
                        </div>
                        {report.clusterA.drift.map(drift => (
                             <div key={drift.id} className="bg-slate-50 rounded-lg p-4 border border-slate-100 mb-4 last:mb-0">
                                <div className="flex items-center justify-between mb-3 text-sm">
                                    <div className="flex-1">
                                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Keyword</span>
                                        <div className="font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">{drift.keyword}</div>
                                    </div>
                                    <div className="px-2 text-slate-300"><ArrowRight className="w-4 h-4" /></div>
                                    <div className="flex-1 text-right">
                                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Drifted Query</span>
                                        <div className="font-mono text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100">{drift.searchTerm}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/50">
                                    <p className="text-xs text-slate-500 font-medium">Drift Score: {drift.driftScore}/100</p>
                                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-3 py-1 rounded hover:bg-blue-50">
                                        Add Exact Match
                                    </button>
                                </div>
                             </div>
                        ))}
                     </div>

                     {/* 3. Low Perf Keywords */}
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                         <h3 className="font-bold text-slate-900 mb-6 flex items-center">
                            <TrendingDown className="w-4 h-4 mr-2 text-orange-500" /> Low-Performing Keywords
                        </h3>
                        <div className="space-y-3">
                            {report.clusterA.lowPerf.map(k => (
                                <div key={k.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{k.keyword}</p>
                                        <p className="text-xs text-slate-400">{k.campaign}</p>
                                        <div className="flex space-x-3 mt-1 items-center">
                                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">{k.issue}</span>
                                            <span className="text-xs text-slate-500">QS: {k.qs}</span>
                                            <span className="text-xs text-slate-500">CPA: {k.cpa}</span>
                                        </div>
                                    </div>
                                    {pausedKeywords.includes(k.id) ? (
                                         <span className="text-xs font-bold text-slate-400 flex items-center"><PauseCircle className="w-3 h-3 mr-1" /> Paused</span>
                                    ) : (
                                        <button 
                                            onClick={() => setConfirmationAction({
                                                type: 'PAUSE_KEYWORD',
                                                title: 'Pause Keyword',
                                                description: `Are you sure you want to pause "${k.keyword}"? It has spent ${k.spend} with poor results.`,
                                                onConfirm: () => executePauseKeyword(k.id)
                                            })}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="Pause Keyword"
                                        >
                                            <PauseCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
            </motion.div>
          )}

          {/* --- TAB 3: WASTE GUARD (Cluster B) --- */}
          {activeTab === GoogleAdsSubView.WASTE_GUARD && (
             <motion.div key="clusterB" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Waste Dimensions */}
                    <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 flex items-center">
                                <DollarSign className="w-4 h-4 mr-2 text-slate-500" /> Multi-Dimension Waste
                            </h3>
                            <div className="text-xs text-slate-500">
                                Target: <span className="font-bold">{userGoal}</span>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {report.clusterB.waste.filter(w => !excludedWaste.includes(w.id)).map(w => {
                                let icon = Globe;
                                if (w.dimension === 'Network') icon = Wifi;
                                if (w.dimension === 'Device') icon = Smartphone;
                                const Icon = icon;

                                return (
                                <div key={w.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-start mb-3 sm:mb-0">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 mr-3 text-slate-400">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center">
                                                <span className="text-sm font-bold text-slate-900 mr-2">{w.segmentName}</span>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">{w.dimension}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{w.recommendation}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">Wasted Spend</p>
                                            <p className="text-sm font-bold text-red-600">{w.spend}</p>
                                        </div>
                                        <button 
                                            onClick={() => setConfirmationAction({
                                                type: 'EXCLUDE_WASTE',
                                                title: `Exclude ${w.segmentName}`,
                                                description: `Confirm exclusion of this ${w.dimension} segment. Estimated savings: ${w.potentialSavings}`,
                                                onConfirm: () => {
                                                    setExcludedWaste([...excludedWaste, w.id]);
                                                    onResolveInsight(`exclude_${w.id}`, { date: new Date().toISOString(), action: `Excluded ${w.segmentName}`, savings: w.potentialSavings });
                                                }
                                            })}
                                            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded hover:border-red-300 hover:text-red-600 shadow-sm"
                                        >
                                            Exclude
                                        </button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>

                    {/* Conversion Health */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                         <h3 className="font-bold text-slate-900 mb-6 flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-slate-500" /> Conversion Health
                        </h3>
                        <div className="space-y-4">
                            {report.clusterB.conversionHealth.map(c => (
                                <div key={c.id} className={`p-4 rounded-lg border ${c.status === 'Healthy' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.status === 'Healthy' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {c.status}
                                        </span>
                                        <span className="text-xs font-bold text-slate-500">{c.discrepancy} vs GA4</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">{c.actionName}</p>
                                    <p className="text-xs text-slate-600 mt-2 italic">{c.issueDescription}</p>
                                </div>
                            ))}
                            <button className="w-full py-2 text-xs font-bold text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50 mt-2">
                                Run Diagnostics
                            </button>
                        </div>
                    </div>
                </div>

                {/* Settings Audit */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-900">Settings Audit Engine</h3>
                    </div>
                    {report.clusterB.settingsAudit.map(s => (
                        <div key={s.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                            <div className="mb-4 md:mb-0">
                                <div className="flex items-center space-x-3 mb-1">
                                    <span className="text-sm font-bold text-slate-900">{s.settingName}</span>
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">Impact: {s.impact}</span>
                                </div>
                                <p className="text-sm text-slate-500">Campaign: <span className="font-medium">{s.campaign}</span></p>
                                <p className="text-xs text-slate-400 mt-1">Current: {s.currentValue} <ArrowRight className="w-3 h-3 inline mx-1"/> Rec: <span className="text-slate-700 font-bold">{s.recommendedValue}</span></p>
                            </div>
                            <div className="flex items-center space-x-6">
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-medium uppercase">Est. Savings</p>
                                    <p className="text-sm font-bold text-green-600">{s.estimatedSavings}</p>
                                </div>
                                {fixedSettings.includes(s.id) ? (
                                    <span className="text-green-600 text-sm font-bold flex items-center px-4"><Check className="w-4 h-4 mr-2"/> Fixed</span>
                                ) : (
                                    <button 
                                        onClick={() => setConfirmationAction({
                                            type: 'FIX_SETTING',
                                            title: `Fix ${s.settingName}`,
                                            description: `Change ${s.settingName} to "${s.recommendedValue}" for campaign "${s.campaign}".`,
                                            onConfirm: () => {
                                                setFixedSettings([...fixedSettings, s.id]);
                                                onResolveInsight(`setting_${s.id}`, { date: new Date().toISOString(), action: `Updated ${s.settingName}`, savings: s.estimatedSavings });
                                            }
                                        })}
                                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm transition-all"
                                    >
                                        Fix Setting
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
             </motion.div>
          )}

           {/* --- TAB 4: CAMPAIGN OPS (Cluster C) --- */}
           {activeTab === GoogleAdsSubView.CAMPAIGN_OPS && (
             <motion.div key="clusterC" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bid Validator */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center">
                            <Sliders className="w-4 h-4 mr-2 text-slate-500" /> Bid Strategy Validator
                        </h3>
                        {report.clusterC.bidStrategies.map(bs => (
                             <div key={bs.id} className="p-4 bg-slate-50 border border-slate-100 rounded-lg mb-4 last:mb-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{bs.campaign}</h4>
                                        <p className="text-xs text-slate-500">Current: {bs.currentStrategy}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                                        bs.status === 'Optimized' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                                    }`}>
                                        {bs.status}
                                    </span>
                                </div>
                                {bs.status !== 'Optimized' && (
                                    <>
                                    <div className="mt-3 flex items-start bg-white p-2 rounded border border-orange-100 mb-3">
                                        <AlertTriangle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-orange-800 font-medium mb-1">{bs.reason}</p>
                                            <p className="text-xs text-slate-600">Rec: <span className="font-bold">{bs.recommendedStrategy}</span></p>
                                        </div>
                                    </div>
                                    <button className="w-full py-1.5 text-xs bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-50">
                                        Update Strategy
                                    </button>
                                    </>
                                )}
                             </div>
                        ))}
                    </div>

                    {/* Budget Pacing */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center">
                            <Wallet className="w-4 h-4 mr-2 text-slate-500" /> Budget Pacing & Allocation
                        </h3>
                        {report.clusterC.budgetPacing.map(bp => {
                             // Simple percent calc for visual
                             const spend = parseInt(bp.currentSpend.replace(/[^0-9]/g, ''));
                             const total = parseInt(bp.projectedSpend.replace(/[^0-9]/g, ''));
                             const pct = Math.min((spend / total) * 100, 100) || 0;
                             
                             return (
                             <div key={bp.id} className="mb-6 last:mb-0">
                                 <div className="flex items-center justify-between mb-2">
                                     <div className="flex-1">
                                         <p className="text-sm font-bold text-slate-900 truncate">{bp.campaign}</p>
                                         <div className="flex items-center space-x-2">
                                             <p className="text-xs text-slate-400">{bp.status}</p>
                                             <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1 rounded">ROAS {bp.roas}</span>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <p className="text-xs font-bold text-slate-700">{bp.currentSpend} <span className="text-slate-400 font-normal">/ {bp.projectedSpend}</span></p>
                                     </div>
                                 </div>
                                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                                     <div className={`h-full rounded-full ${bp.status === 'Limited by Budget' ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }}></div>
                                 </div>
                                 
                                 {bp.reallocationOpportunity && (
                                     <div className="bg-green-50 p-3 rounded border border-green-100 flex items-center justify-between">
                                         <div className="flex items-center">
                                            <ArrowRightLeft className="w-4 h-4 text-green-600 mr-2" />
                                            <div>
                                                <p className="text-xs text-green-800 font-bold">Shift {bp.reallocationOpportunity.amount} to "{bp.reallocationOpportunity.targetCampaign}"</p>
                                                <p className="text-[10px] text-green-700">Gain {bp.reallocationOpportunity.projectedUplift}</p>
                                            </div>
                                         </div>
                                         <button className="text-xs bg-white border border-green-200 text-green-700 font-bold px-3 py-1.5 rounded shadow-sm hover:bg-green-100">
                                            Apply
                                         </button>
                                     </div>
                                 )}
                             </div>
                        )})}
                    </div>
                </div>
             </motion.div>
          )}

           {/* --- TAB 5: CREATIVE LAB (Cluster D) --- */}
           {activeTab === GoogleAdsSubView.CREATIVE_LAB && (
             <motion.div key="clusterD" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quality Score Optimizer */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                             <h3 className="font-bold text-slate-900 flex items-center">
                                <Target className="w-4 h-4 mr-2 text-indigo-500" /> Quality Score Breakdown
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {report.clusterD.qualityScores.map(qs => (
                                <div key={qs.id} className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{qs.keyword}</h4>
                                            <p className="text-xs text-slate-400">{qs.campaign}</p>
                                            <p className="text-xs text-red-500 font-medium mt-1">Penalty: {qs.costPenalty} due to low score</p>
                                        </div>
                                        <div className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white font-bold rounded-lg shadow-md text-lg">{qs.score}</div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2">
                                        {qs.components.map((comp, idx) => {
                                            const isBad = comp.status === 'Below Average';
                                            const isAvg = comp.status === 'Average';
                                            return (
                                            <div key={idx} className={`p-2 rounded text-center border ${isBad ? 'bg-red-50 border-red-100' : isAvg ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{comp.component}</p>
                                                <p className={`text-xs font-bold ${isBad ? 'text-red-700' : isAvg ? 'text-orange-700' : 'text-green-700'}`}>{comp.status}</p>
                                            </div>
                                        )})}
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center">
                                            Improve {qs.components.find(c => c.status === 'Below Average')?.component || 'Score'} <ExternalLink className="w-3 h-3 ml-1" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ad Copy Analyzer */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                             <h3 className="font-bold text-slate-900 flex items-center">
                                <MousePointer2 className="w-4 h-4 mr-2 text-blue-500" /> Asset Performance
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {report.clusterD.adAssets.map(ad => (
                                <div key={ad.id} className="p-6 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center mb-2">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mr-2 ${ad.performance === 'Best' ? 'bg-green-100 text-green-700' : ad.performance === 'Low' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {ad.performance}
                                            </span>
                                            <span className="text-xs text-slate-400">{ad.type}</span>
                                        </div>
                                        <span className="text-xs font-mono text-slate-500">{ad.impressions} imps</span>
                                    </div>
                                    
                                    <p className="text-sm font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3 italic">"{ad.assetText}"</p>
                                    
                                    <div className="flex justify-end">
                                        {retiredAssets.includes(ad.id) ? (
                                            <span className="text-xs text-slate-400 font-bold">Retired</span>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    if(ad.recommendation === 'Retire') {
                                                        setConfirmationAction({
                                                            type: 'RETIRE_ASSET',
                                                            title: 'Retire Asset',
                                                            description: 'This will pause the low-performing asset in its ad group.',
                                                            onConfirm: () => {
                                                                setRetiredAssets([...retiredAssets, ad.id]);
                                                                onResolveInsight(`retire_${ad.id}`);
                                                            }
                                                        });
                                                    }
                                                }}
                                                className={`text-xs font-bold px-3 py-1.5 rounded border transition-colors ${
                                                    ad.recommendation === 'Retire' 
                                                        ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                                        : 'border-green-200 text-green-600 hover:bg-green-50'
                                                }`}
                                            >
                                                {ad.recommendation === 'Retire' ? 'Retire Asset' : 'Scale Asset'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             </motion.div>
          )}

          {/* --- TAB 6: PMAX POWER (Cluster E) --- */}
          {activeTab === GoogleAdsSubView.PMAX_POWER && (
             <motion.div key="clusterE" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-8">
                
                {/* Transparency Dashboard */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">Channel Spending Breakdown</h3>
                            <p className="text-sm text-slate-500">Unveiling the "Black Box" of Performance Max</p>
                        </div>
                        <div className="text-right">
                             <p className="text-3xl font-bold text-indigo-600">$1,300</p>
                             <p className="text-xs text-slate-400 font-medium uppercase">Total Spend</p>
                        </div>
                    </div>
                    
                    {/* Visual Bar */}
                    <div className="flex h-16 rounded-lg overflow-hidden mb-8 shadow-inner ring-4 ring-slate-50">
                        {report.clusterE.pmaxBreakdown.map((item, idx) => {
                             const bgColors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-red-500'];
                             return (
                                <div 
                                    key={idx} 
                                    className={`${bgColors[idx % bgColors.length]} h-full relative group transition-all hover:opacity-90 flex items-center justify-center`} 
                                    style={{ width: `${item.percentage}%` }}
                                >
                                    {item.percentage > 10 && <span className="text-white font-bold text-sm shadow-sm">{item.percentage}%</span>}
                                    <div className="absolute top-full mt-2 hidden group-hover:block bg-slate-900 text-white text-xs p-2 rounded z-10 whitespace-nowrap shadow-xl">
                                        {item.channel}: {item.spend} {item.isInferred && '(Inferred)'}
                                    </div>
                                </div>
                             );
                        })}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {report.clusterE.pmaxBreakdown.map((item, idx) => {
                            const textColors = ['text-blue-500', 'text-indigo-500', 'text-purple-500', 'text-red-500'];
                            return (
                                <div key={idx} className="p-4 border border-slate-100 rounded-lg hover:shadow-md transition-shadow relative">
                                    <div className={`text-xs font-bold uppercase mb-2 ${textColors[idx % textColors.length]}`}>
                                        {item.channel}
                                        {item.isInferred && <span className="ml-1 text-slate-400 font-normal normal-case" title="Estimated via heuristics">(Inferred)</span>}
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <div className="text-lg font-bold text-slate-900">{item.spend}</div>
                                        <div className="text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">ROAS {item.roas}</div>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">Conv. Value: {item.conversionValue}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Alternative Simulator */}
                {report.clusterE.alternatives.map((alt, idx) => (
                    <div key={idx} className="bg-slate-900 text-slate-300 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden">
                        <div className="relative z-10 mb-6 md:mb-0">
                            <div className="flex items-center space-x-2 mb-2">
                                <Sparkles className="w-5 h-5 text-yellow-400" />
                                <h3 className="text-white font-bold text-lg">Efficiency Opportunity Detected</h3>
                            </div>
                            <p className="text-sm max-w-lg mb-4 leading-relaxed">
                                Our models suggest splitting <span className="text-white font-semibold">"{alt.pmaxCampaign}"</span> into component campaigns could improve control and ROI.
                            </p>
                            <div className="flex space-x-4 text-xs font-mono">
                                <div className="px-3 py-2 bg-slate-800 rounded border border-slate-700">
                                    <span className="text-slate-400 block mb-1">Search Component</span>
                                    <span className="text-white font-bold">{alt.suggestedSplit.searchStructure}</span>
                                </div>
                                <div className="px-3 py-2 bg-slate-800 rounded border border-slate-700">
                                    <span className="text-slate-400 block mb-1">Shopping Component</span>
                                    <span className="text-white font-bold">{alt.suggestedSplit.shoppingStructure}</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-slate-500 bg-slate-800/50 p-2 rounded w-fit">
                                <Info className="w-3 h-3 mr-2" /> Guidance Only: This does not create campaigns.
                            </div>
                        </div>
                        <div className="relative z-10 text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                            <p className="text-xs uppercase font-bold text-white/60 mb-1">Projected Gain</p>
                            <p className="text-3xl font-bold text-green-400 mb-3">{alt.projectedEfficiencyGain}</p>
                            <button className="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors w-full text-sm">
                                Simulate Split
                            </button>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                    </div>
                ))}
             </motion.div>
          )}

          {/* --- TAB 7: ROADMAP --- */}
          {activeTab === GoogleAdsSubView.ROADMAP && (
              <motion.div
                key="roadmap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto"
             >
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Optimization Roadmap</h2>
                  <p className="text-slate-500 text-sm">Your guided plan for the next 8 weeks.</p>
                </div>

                <div className="space-y-6">
                    {/* Month 1 */}
                    <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center mb-4">
                            <Calendar className="w-5 h-5 text-indigo-500 mr-2" />
                            Month 1: Quick Wins
                        </h3>
                        <div className="space-y-3">
                            {roadmapTasks.filter(t => t.month === 1).map(task => (
                                <div key={task.id} className="flex items-start cursor-pointer hover:bg-slate-50 p-2 rounded-lg -ml-2 transition-colors" onClick={() => onToggleRoadmapTask(task.id)}>
                                    <div className={`mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                        task.completed ? 'bg-green-100 border-green-200 text-green-600' : 'bg-white border-slate-300'
                                    }`}>
                                        {task.completed && <Check className="w-3 h-3" />}
                                    </div>
                                    <div className={task.completed ? 'opacity-50 transition-opacity' : ''}>
                                        <p className={`text-sm font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                            {task.label}
                                        </p>
                                        <p className="text-xs text-slate-500">{task.subLabel}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Month 2 */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                         <h3 className="text-lg font-bold text-slate-900 flex items-center mb-4">
                            <ArrowRight className="w-5 h-5 text-slate-400 mr-2" />
                            Month 2: Strategic Initiatives
                        </h3>
                        <div className="space-y-3">
                            {roadmapTasks.filter(t => t.month === 2).map(task => (
                                <div key={task.id} className="flex items-start cursor-pointer hover:bg-slate-100 p-2 rounded-lg -ml-2 transition-colors" onClick={() => onToggleRoadmapTask(task.id)}>
                                    <div className={`mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                        task.completed ? 'bg-green-100 border-green-200 text-green-600' : 'bg-white border-slate-300'
                                    }`}>
                                        {task.completed && <Check className="w-3 h-3" />}
                                    </div>
                                    <div className={task.completed ? 'opacity-50 transition-opacity' : ''}>
                                        <p className={`text-sm font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-600'}`}>
                                            {task.label}
                                        </p>
                                        <p className="text-xs text-slate-400">{task.subLabel}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal Render */}
      <ConfirmationModal 
          isOpen={!!confirmationAction}
          title={confirmationAction?.title}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmationAction(null)}
      >
          {confirmationAction?.description}
      </ConfirmationModal>

    </div>
  );
};