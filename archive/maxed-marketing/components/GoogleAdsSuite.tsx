import React, { useState, useEffect } from 'react';
import { GoogleAdsSubView, InsightCardData, ActionLog, RoadmapTask, LowPerfKeyword, SearchTermDrift } from '../types';
import { Search, Filter, Ban, CheckCircle, AlertOctagon, TrendingDown, DollarSign, MousePointer2, BarChart3, Unlock, Calendar, Check, ArrowRight, Activity, Wallet, PieChart, Target, AlertTriangle, ArrowRightLeft, PauseCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GoogleAdsSuiteProps {
  initialSubView?: GoogleAdsSubView;
  wasteInsight: InsightCardData;
  lowPerfKeywords: LowPerfKeyword[];
  driftAnalysis: SearchTermDrift;
  resolvedInsightIds: string[];
  wasteWatchUnlocked: boolean;
  wasteWatchLog: ActionLog[];
  onResolveInsight: (id: string, logEntry?: ActionLog) => void;
  roadmapTasks: RoadmapTask[];
  onToggleRoadmapTask: (id: string) => void;
}

export const GoogleAdsSuite: React.FC<GoogleAdsSuiteProps> = ({ 
  initialSubView = GoogleAdsSubView.OVERVIEW, 
  wasteInsight,
  lowPerfKeywords,
  driftAnalysis,
  resolvedInsightIds,
  wasteWatchUnlocked,
  wasteWatchLog,
  onResolveInsight,
  roadmapTasks,
  onToggleRoadmapTask
}) => {
  const [activeTab, setActiveTab] = useState<GoogleAdsSubView>(initialSubView);
  
  // Specific States for the Cards
  const [keywordsPaused, setKeywordsPaused] = useState(false);
  const [driftFixed, setDriftFixed] = useState(false);

  // Sync prop change to state if navigated externally
  useEffect(() => {
    setActiveTab(initialSubView);
  }, [initialSubView]);

  const tabs = [
    { id: GoogleAdsSubView.OVERVIEW, label: 'Overview' },
    { id: GoogleAdsSubView.OPPORTUNITIES, label: 'Opportunities', count: 2 },
    { id: GoogleAdsSubView.WASTE_WATCH, label: 'Waste Watch', count: wasteWatchLog.length, locked: !wasteWatchUnlocked },
    { id: GoogleAdsSubView.ROADMAP, label: 'Roadmap' },
  ];

  const handlePauseKeywords = () => {
    setKeywordsPaused(true);
    // TODO: API INTEGRATION POINT
    // Endpoint: POST /api/google-ads/keywords/pause
    // Body: { keywordIds: ['k1', 'k2', ...] }
    setTimeout(() => setKeywordsPaused(false), 2000); // Reset for demo
  };

  const handleFixDrift = () => {
    setDriftFixed(true);
    // TODO: API INTEGRATION POINT
    // Endpoint: POST /api/google-ads/negative-keywords
    // Body: { term: driftAnalysis.driftingTerm.term, campaignId: driftAnalysis.id, matchType: 'EXACT' }
    setTimeout(() => setDriftFixed(false), 2000); // Reset for demo
  };

  const isWasteResolved = resolvedInsightIds.includes(wasteInsight.id);

  return (
    <div className="h-full flex flex-col bg-white min-h-screen">
      {/* Mini-App Header */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-0 px-4 md:px-8 sticky top-0 z-30">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Google Ads Suite</h1>
            <p className="text-slate-500 text-sm">Campaign Optimization & Management</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200 flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Active
            </span>
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="flex space-x-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                  if (!tab.locked) setActiveTab(tab.id);
              }}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors relative flex items-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } ${tab.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tab.label}
              {tab.locked && <Unlock className="w-3 h-3 ml-2 text-slate-400" />}
              {!tab.locked && (tab.count !== undefined) && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-50 p-4 md:p-8">
        <AnimatePresence mode="wait">
          
          {/* OVERVIEW TAB */}
          {activeTab === GoogleAdsSubView.OVERVIEW && (
             <motion.div
               key="overview"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="max-w-5xl mx-auto"
             >
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Account Health Check</h2>
                  <p className="text-slate-500 text-sm">Real-time performance snapshot for George's Music.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Card 1: Health Score */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <span className="text-slate-500 text-sm font-medium">Account Health Score</span>
                            <Activity className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-900">72<span className="text-lg text-slate-400 font-normal">/100</span></div>
                            <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full rounded-full" style={{ width: '72%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Budget Pacing */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <span className="text-slate-500 text-sm font-medium">Budget Pacing</span>
                            <Wallet className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">On Track</div>
                            <div className="text-xs text-slate-500 mt-1">Spending $2,405 of $3,000</div>
                        </div>
                    </div>

                     {/* Card 3: Total Wasted Spend */}
                     <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <span className="text-slate-500 text-sm font-medium">Lifetime Waste</span>
                            <TrendingDown className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">$2,500</div>
                            <div className="text-xs text-red-500 mt-1 font-medium">Requires Optimization</div>
                        </div>
                    </div>

                    {/* Card 4: Actionable Opportunities */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <span className="text-slate-500 text-sm font-medium">Actionable Opportunities</span>
                            <Target className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-900">2</div>
                            <div className="text-xs text-slate-500 mt-1">Pending Actions</div>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-indigo-900">Ready to optimize?</h3>
                        <p className="text-indigo-700 mt-1">You have pending opportunities that could save budget immediately.</p>
                    </div>
                    <button 
                        onClick={() => setActiveTab(GoogleAdsSubView.OPPORTUNITIES)}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    >
                        View Opportunities
                    </button>
                </div>
             </motion.div>
          )}

          {/* OPPORTUNITIES TAB */}
          {activeTab === GoogleAdsSubView.OPPORTUNITIES && (
            <motion.div
              key="opportunities"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto space-y-8 pb-12"
            >
              <div className="mb-2">
                <h2 className="text-lg font-bold text-slate-900">High Priority Suggestions</h2>
                <p className="text-slate-500 text-sm">Actionable insights to improve ROAS immediately.</p>
              </div>

              {/* 
                 NOTE: The legacy 'Waste' card (Negative Keyword Alert) has been removed 
                 to prioritize the new Cluster A modules below. 
              */}

              {/* 1. Low-Performing Keyword Identifier (Cluster A Module) */}
              {/* TODO: API INTEGRATION POINT - GET /api/google-ads/opportunities/low-performing-keywords */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Low-Performing Keywords</h3>
                      </div>
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-semibold">Low Quality Score</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100">
                          <thead className="bg-slate-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Keyword</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Spend</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">CTR</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quality Score</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                              {lowPerfKeywords.map((k) => (
                                  <tr key={k.id}>
                                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{k.keyword}</td>
                                      <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{k.spend}</td>
                                      <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{k.ctr}</td>
                                      <td className="px-6 py-3 whitespace-nowrap text-sm text-red-500 font-semibold">{k.qualityScore}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                      {keywordsPaused ? (
                           <div className="flex items-center text-green-600 font-bold px-4 py-2">
                             <CheckCircle className="w-5 h-5 mr-2" />
                             Keywords Paused
                           </div>
                      ) : (
                          <button 
                            onClick={handlePauseKeywords}
                            className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                          >
                             <PauseCircle className="w-4 h-4 mr-2" />
                             Pause These Keywords
                          </button>
                      )}
                  </div>
              </div>

              {/* 2. Search Term Match Analyzer / Drift Detector (Cluster A Module) */}
              {/* TODO: API INTEGRATION POINT - GET /api/google-ads/opportunities/search-term-drift */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Search Term Drift Detected</h3>
                            <p className="text-xs text-slate-500">Campaign: {driftAnalysis.campaignName}</p>
                        </div>
                      </div>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">Intent Mismatch</span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Good Term */}
                      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-green-700 uppercase">Target Intent</span>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                          <p className="text-lg font-bold text-slate-900 mb-1">{driftAnalysis.goodTerm.term}</p>
                          <div className="flex items-center text-sm text-slate-600">
                             <span className="font-semibold mr-2">{driftAnalysis.goodTerm.metricLabel}:</span>
                             {driftAnalysis.goodTerm.metricValue}
                          </div>
                      </div>

                      {/* Drifting Term */}
                      <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-red-700 uppercase">Drift Detected</span>
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                          </div>
                          <p className="text-lg font-bold text-slate-900 mb-1">{driftAnalysis.driftingTerm.term}</p>
                          <div className="flex items-center text-sm text-slate-600">
                             <span className="font-semibold mr-2">{driftAnalysis.driftingTerm.metricLabel}:</span>
                             {driftAnalysis.driftingTerm.metricValue}
                          </div>
                      </div>
                  </div>

                   <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                      {driftFixed ? (
                           <div className="flex items-center text-green-600 font-bold px-4 py-2">
                             <CheckCircle className="w-5 h-5 mr-2" />
                             Added to Negative List
                           </div>
                      ) : (
                          <button 
                            onClick={handleFixDrift}
                            className="flex items-center px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                          >
                             <Ban className="w-4 h-4 mr-2" />
                             Add to Negative List
                          </button>
                      )}
                  </div>
              </div>

            </motion.div>
          )}

          {/* WASTE WATCH TAB */}
          {activeTab === GoogleAdsSubView.WASTE_WATCH && (
             <motion.div
                key="wastewatch"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-4xl mx-auto"
             >
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Waste Watch Log</h2>
                        <p className="text-slate-500 text-sm">Tracked actions that saved you money.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase">Actions Taken This Month</span>
                        <div className="text-2xl font-bold text-green-600">$420.50<span className="text-sm text-slate-400 font-normal">/mo</span></div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                    {/* TODO: API INTEGRATION POINT - GET /api/google-ads/audit-logs */}
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action Taken</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Est. Savings</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {wasteWatchLog.map((log, idx) => (
                                <tr key={idx}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{log.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                        {log.action}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold text-right">{log.savings}</td>
                                </tr>
                            ))}
                            {wasteWatchLog.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">No actions taken yet this month.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
             </motion.div>
          )}

          {/* ROADMAP TAB */}
          {activeTab === GoogleAdsSubView.ROADMAP && (
              <motion.div
                key="roadmap"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-4xl mx-auto"
             >
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900">Optimization Roadmap</h2>
                  <p className="text-slate-500 text-sm">Your guided plan for the next 8 weeks.</p>
                </div>

                {/* TODO: API INTEGRATION POINT - GET /api/roadmap */}
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
    </div>
  );
};