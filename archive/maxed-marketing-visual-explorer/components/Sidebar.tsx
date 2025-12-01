import React from 'react';
import { Theme, View } from '../types';
import { LayoutDashboard, TrendingUp, Sparkles, MapPin, Settings, HelpCircle, BarChart3, ChevronRight, Lock, MessageSquare } from 'lucide-react';

interface SidebarProps {
  theme: Theme;
  currentView: View;
  setView: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ theme, currentView, setView }) => {
  const isFocus = theme === 'focus';

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'brand-voice', icon: MessageSquare, label: 'Brand Voice Tracker' },
    { id: 'google-ads', icon: BarChart3, label: 'Google Ads Suite' },
    { id: 'social-spark', icon: Sparkles, label: 'Social Spark' },
    { id: 'local-seo', icon: MapPin, label: 'Local SEO', locked: true },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  // Hybrid Layout: Sidebar is ALWAYS dark foundation (amplify-dark)
  return (
    <aside className="w-64 bg-amplify-dark border-r border-slate-800 flex flex-col h-full transition-theme flex-shrink-0 z-20">
      <div className="p-6">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-amplify-green rounded-lg flex items-center justify-center text-amplify-darker font-bold text-xl relative overflow-hidden">
             <span className="z-10">M</span>
             <div className="absolute top-0 right-0 w-4 h-4 bg-white/30 rounded-bl-lg"></div>
           </div>
           <div>
             <h1 className="text-lg font-bold text-white tracking-tight leading-none">MAXED</h1>
             <p className="text-[10px] text-amplify-green font-mono tracking-widest uppercase">Marketing.OS</p>
           </div>
        </div>
      </div>
      
      <nav className="flex-1 px-3 space-y-1 mt-4">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Apps</div>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <div
              key={item.id}
              onClick={() => !item.locked && setView(item.id as View)}
              className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all cursor-pointer group relative ${
                isActive
                  ? 'bg-slate-800 text-amplify-green border border-slate-700'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              } ${item.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={`transition-colors ${isActive ? 'text-amplify-green' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-amplify-green" />}
              {item.locked && <Lock size={12} className="text-slate-600" />}
            </div>
          );
        })}
      </nav>

      <div className="p-4">
        {isFocus ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2 text-amplify-green mb-2">
              <HelpCircle size={18} />
              <span className="font-bold text-sm">Need a hand?</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Our marketing guides are here to support your growth.</p>
            <button className="w-full bg-amplify-green py-2 rounded-lg text-xs font-bold text-amplify-darker hover:bg-white transition-colors">
              Open Guide
            </button>
          </div>
        ) : (
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-2">
               <span>SYSTEM</span>
               <span className="text-amplify-green">ONLINE</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
               <div className="bg-amplify-green w-3/4 h-full"></div>
            </div>
            <div className="text-[10px] text-slate-600 font-mono mt-2">
              ID: D3-EXEC-VIEW
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};