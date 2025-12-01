import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { GoogleAdsSuite } from './components/GoogleAdsSuite';
import { SocialSpark } from './components/SocialSpark';
import { Settings } from './components/Settings';
import { GoogleAdsService } from './services/GoogleAdsService';
import { CUSTOMER_PROFILE, INSIGHTS_DATA as STATIC_INSIGHTS } from './constants';
import { AppView, GoogleAdsSubView, ActionLog, RoadmapTask, InsightCardData, LowPerfKeyword, SearchTermDrift } from './types';
import { Menu, X, Sparkles, Lock, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [googleAdsSubView, setGoogleAdsSubView] = useState<GoogleAdsSubView>(GoogleAdsSubView.OVERVIEW);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Navigation & Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState('');
  const [lockedFeatureId, setLockedFeatureId] = useState<AppView | null>(null);
  const [unlockedItems, setUnlockedItems] = useState<AppView[]>([]);

  // Lifted State for Business Logic
  const [resolvedInsightIds, setResolvedInsightIds] = useState<string[]>([]);
  const [wasteWatchUnlocked, setWasteWatchUnlocked] = useState(false);
  const [wasteWatchLog, setWasteWatchLog] = useState<ActionLog[]>([]);
  
  // Settings State
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({
    instagram: true,
    facebook: false,
    tiktok: false,
    linkedin: true,
    youtube: false
  });
  
  // Data State
  const [adsSuiteData, setAdsSuiteData] = useState<InsightCardData | null>(null);
  const [lowPerfKeywords, setLowPerfKeywords] = useState<LowPerfKeyword[]>([]);
  const [driftAnalysis, setDriftAnalysis] = useState<SearchTermDrift | null>(null);
  const [isLoadingAdsData, setIsLoadingAdsData] = useState(true);

  // Roadmap State
  const [roadmapTasks, setRoadmapTasks] = useState<RoadmapTask[]>([
    { id: 't1', label: 'Audit Negative Keywords', subLabel: 'Completed today', completed: true, month: 1 },
    { id: 't2', label: 'Optimize Ad Schedule for Store Hours', subLabel: 'Scheduled for Week 2', completed: false, month: 1 },
    { id: 't3', label: 'Review Geo-Targeting Efficiency', subLabel: 'Scheduled for Week 3', completed: false, month: 1 },
    { id: 't4', label: 'Launch "Local Inventory" Ads', subLabel: 'Requires Merchant Center Link', completed: false, month: 2 },
    { id: 't5', label: 'Competitor Conquesting Campaign', subLabel: 'Targeting "Guitar Center" terms', completed: false, month: 2 },
  ]);

  // Fetch Data from Service on Mount
  useEffect(() => {
    const fetchAdsData = async () => {
      setIsLoadingAdsData(true);
      try {
        // Querying the "Data Lake" via our service
        // TODO: API INTEGRATION POINT - GET /api/data-lake/google-ads-report
        const report = await GoogleAdsService.getNegativeKeywordReport('client_123');
        const extendedData = await GoogleAdsService.getExtendedOpportunities('client_123');
        
        setAdsSuiteData(report.insight);
        setLowPerfKeywords(extendedData.lowPerfKeywords);
        setDriftAnalysis(extendedData.driftAnalysis);

        // If we had history in the report, we could merge it here:
        // setWasteWatchLog(report.logs); 
      } catch (error) {
        console.error("Failed to fetch ads report", error);
      } finally {
        setIsLoadingAdsData(false);
      }
    };

    fetchAdsData();
  }, []);

  // Merge static insights with fetched Google Ads insight
  const combinedInsights = [
    ...(adsSuiteData ? [adsSuiteData] : []),
    ...STATIC_INSIGHTS.filter(i => i.type !== 'WASTE') // Remove static waste if present to avoid dupes
  ];

  const handleNavigateToSuite = (insightId?: string) => {
    setCurrentView(AppView.GOOGLE_ADS);
    if (insightId === 'waste-001') {
      setGoogleAdsSubView(GoogleAdsSubView.OPPORTUNITIES);
    } else {
      setGoogleAdsSubView(GoogleAdsSubView.OVERVIEW);
    }
  };

  const handleLockedItemClick = (viewId: AppView, featureName: string) => {
    setLockedFeatureId(viewId);
    setLockedFeatureName(featureName);
    setShowUpgradeModal(true);
  };

  const handleMaybeLater = () => {
    if (lockedFeatureId) {
      setUnlockedItems(prev => [...prev, lockedFeatureId]);
      setCurrentView(lockedFeatureId);
    }
    setShowUpgradeModal(false);
  };

  const handleResolveInsight = (id: string, logEntry?: ActionLog) => {
    if (!resolvedInsightIds.includes(id)) {
      setResolvedInsightIds(prev => [...prev, id]);
    }
    if (logEntry) {
      setWasteWatchUnlocked(true);
      setWasteWatchLog(prev => [logEntry, ...prev]);
    }
  };

  const handleToggleRoadmapTask = (taskId: string) => {
    // TODO: API INTEGRATION POINT - PUT /api/roadmap/{taskId}
    setRoadmapTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleTogglePlatform = (platformId: string) => {
    setConnectedPlatforms(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }));
  };

  const renderContent = () => {
    if (isLoadingAdsData && currentView === AppView.GOOGLE_ADS) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Querying Data Lake...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            customer={CUSTOMER_PROFILE} 
            insights={combinedInsights}
            resolvedInsightIds={resolvedInsightIds}
            onNavigateToSuite={handleNavigateToSuite}
          />
        );
      case AppView.GOOGLE_ADS:
        return (
          (adsSuiteData && driftAnalysis) ? (
            <GoogleAdsSuite 
              initialSubView={googleAdsSubView} 
              wasteInsight={adsSuiteData}
              lowPerfKeywords={lowPerfKeywords}
              driftAnalysis={driftAnalysis}
              resolvedInsightIds={resolvedInsightIds}
              wasteWatchUnlocked={wasteWatchUnlocked}
              wasteWatchLog={wasteWatchLog}
              onResolveInsight={handleResolveInsight}
              roadmapTasks={roadmapTasks}
              onToggleRoadmapTask={handleToggleRoadmapTask}
            />
          ) : <div>Error loading Ads Data</div>
        );
      case AppView.SOCIAL_SPARK:
        return <SocialSpark />;
      case AppView.LOCAL_SEO:
        return (
           <div className="p-10 flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50">
            <div className="w-16 h-16 mb-4 bg-slate-200 rounded-full flex items-center justify-center">
               <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-slate-600">Local SEO</h2>
            <p>Reputation management tools would appear here.</p>
          </div>
        );
      case AppView.SETTINGS:
        return (
          <Settings 
            platforms={connectedPlatforms}
            onTogglePlatform={handleTogglePlatform}
          />
        );
      default:
        return (
          <div className="p-10 flex flex-col items-center justify-center h-full text-slate-500">
             <h2 className="text-xl">Feature Locked</h2>
             <p>This module is not included in your current plan.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <span className="font-bold text-lg">Maxed Marketing</span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar (Desktop) & Mobile Overlay */}
      <div className={`
        fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden
        ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `} onClick={() => setMobileMenuOpen(false)}></div>
      
      {/* Sidebar Wrapper */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 
        md:translate-x-0 md:static md:block
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
          <Sidebar 
            currentView={currentView} 
            onChangeView={(view) => {
              setCurrentView(view);
              setMobileMenuOpen(false);
            }} 
            onLockedItemClick={handleLockedItemClick}
            unlockedItems={unlockedItems}
            className="w-full h-full shadow-xl"
            onClose={() => setMobileMenuOpen(false)}
          />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-0 pt-14 md:pt-0 overflow-x-hidden min-h-screen relative">
        {renderContent()}
      </main>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-indigo-600 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Sparkles className="w-24 h-24 transform rotate-12 translate-x-8 -translate-y-8" />
                </div>
                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                    <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Unlock the Full Suite</h3>
              </div>
              
              <div className="p-8 text-center">
                <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                  <strong className="text-slate-900">George's Music</strong>, your current plan does not include <span className="font-semibold text-indigo-600">{lockedFeatureName}</span>. 
                </p>
                <p className="text-slate-500 text-sm mb-8">
                  Upgrade now to generate high-converting content and fix your Local SEO listings.
                </p>
                
                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transform transition-all hover:-translate-y-0.5"
                >
                  Upgrade to Pro
                </button>
                <button 
                  onClick={handleMaybeLater}
                  className="mt-4 text-sm text-slate-400 hover:text-slate-600 font-medium"
                >
                  Maybe Later (Continue to Maxed Marketing)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;