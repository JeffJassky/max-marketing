import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart2, 
  Settings, 
  Users, 
  FileText, 
  HelpCircle,
  Menu,
  Monitor,
  Terminal,
  Search,
  Bell,
  Activity,
  ChevronDown,
  ChevronRight,
  Hash,
  Globe,
  MessageSquare,
  Star
} from 'lucide-react';
import { DesignMode } from './BrandVoiceTracker';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<DesignMode>('focus');
  const location = useLocation();

  const isFocus = mode === 'focus';
  const bgColor = isFocus ? 'bg-stone-50' : 'bg-amplify-darker';
  const textColor = isFocus ? 'text-slate-900' : 'text-slate-200';
  const fontClass = isFocus ? 'font-sans' : 'font-mono';

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname.includes('/brand-voice')) return 'Brand Voice Tracker';
    return 'System';
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isBrandVoiceActive = location.pathname.includes('/brand-voice');

  return (
    <div className={`min-h-screen ${bgColor} flex ${fontClass} ${textColor} transition-colors duration-500`}>
      
      {/* Sidebar - Always Dark */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-amplify-dark border-r border-slate-800 text-slate-300 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col`}>
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3 font-bold text-white tracking-wider">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-amplify-dark font-black text-xl shadow-lg shadow-amplify-green/20 bg-amplify-green`}>
              M
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base tracking-widest font-mono">MAXED</span>
              <span className="text-[10px] text-amplify-green tracking-[0.2em] font-mono">OS.V2</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
          <div className="px-2 mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 font-mono">
             System Modules
          </div>
          
          <Link to="/" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 transition-all group ${
            isActive('/') && !isBrandVoiceActive
             ? 'bg-slate-800 text-amplify-green border-amplify-green shadow-inner shadow-black/20'
             : 'bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50'
          }`}>
            <LayoutDashboard className={`w-5 h-5 ${isActive('/') && !isBrandVoiceActive ? 'text-amplify-green' : 'text-slate-500 group-hover:text-white'}`} />
            <span className="font-medium tracking-wide">Dashboard</span>
          </Link>

          {/* Brand Voice Group */}
          <div className="space-y-1">
            <Link to="/brand-voice" className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-l-2 transition-all group ${
              isBrandVoiceActive
              ? 'bg-slate-800 text-amplify-green border-amplify-green shadow-inner shadow-black/20'
              : 'bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50'
            }`}>
              <div className="flex items-center gap-3">
                <Activity className={`w-5 h-5 ${isBrandVoiceActive ? 'text-amplify-green' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="font-medium tracking-wide">Brand Voice</span>
              </div>
              {isBrandVoiceActive ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
            </Link>

            {/* Sub Menu */}
            {isBrandVoiceActive && (
              <div className="ml-4 pl-4 border-l border-slate-800 space-y-1 my-2 animate-fade-in">
                 <Link to="/brand-voice" className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${location.pathname === '/brand-voice' ? 'text-white bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    Overview
                 </Link>
                 <Link to="/brand-voice/search" className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${location.pathname.includes('search') ? 'text-amplify-green bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Search className="w-3 h-3" />
                    Search
                 </Link>
                 <Link to="/brand-voice/social" className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${location.pathname.includes('social') ? 'text-amplify-secondary bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Hash className="w-3 h-3" />
                    Social
                 </Link>
                 <Link to="/brand-voice/reviews" className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${location.pathname.includes('reviews') ? 'text-amber-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Star className="w-3 h-3" />
                    Reviews
                 </Link>
                 <Link to="/brand-voice/website" className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${location.pathname.includes('website') ? 'text-sky-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Globe className="w-3 h-3" />
                    Website
                 </Link>
              </div>
            )}
          </div>
          
          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 border-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all group cursor-not-allowed opacity-50">
            <BarChart2 className="w-5 h-5 text-slate-500 group-hover:text-white" />
            <span className="font-medium tracking-wide">Campaigns</span>
          </div>

          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 border-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all group cursor-not-allowed opacity-50">
            <Users className="w-5 h-5 text-slate-500 group-hover:text-white" />
            <span className="font-medium tracking-wide">Audiences</span>
          </div>

          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 border-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all group cursor-not-allowed opacity-50">
            <FileText className="w-5 h-5 text-slate-500 group-hover:text-white" />
            <span className="font-medium tracking-wide">Reports</span>
          </div>

          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 border-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all group cursor-not-allowed opacity-50">
            <Settings className="w-5 h-5 text-slate-500 group-hover:text-white" />
            <span className="font-medium tracking-wide">Config</span>
          </div>
        </div>

        {/* Bottom Widget */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-amplify-green mb-2">
              <HelpCircle className="w-4 h-4" />
              <span className="font-bold text-xs font-mono uppercase">Support_Link</span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed font-mono">
              [SYSTEM: ONLINE]
              <br/>
              Guide v2.4 loaded.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className={`h-20 flex items-center justify-between px-8 z-40 transition-colors duration-500 border-b ${
          isFocus 
            ? 'bg-white/80 backdrop-blur-md border-stone-200' 
            : 'bg-amplify-darker border-slate-800'
        }`}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className={`text-xl font-bold tracking-tight ${isFocus ? 'text-slate-900' : 'text-white'}`}>
                {isFocus ? getPageTitle() : `PROTOCOL: ${getPageTitle().toUpperCase().replace(' ', '_')}`}
              </h2>
              {!isFocus && <span className="text-[10px] text-amplify-green font-mono uppercase">[SECURE_CONNECTION]</span>}
            </div>
          </div>

          <div className="flex items-center gap-6">
             {/* Mode Toggle */}
             <div className="flex items-center bg-slate-900 p-1 rounded-full border border-slate-700">
                <button 
                  onClick={() => setMode('focus')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isFocus ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  L3
                </button>
                <button 
                  onClick={() => setMode('executive')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    !isFocus ? 'bg-amplify-green text-slate-900 shadow-[0_0_10px_rgba(195,253,52,0.3)]' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Terminal className="w-3 h-3" />
                  D3
                </button>
             </div>

             {/* Search Bar */}
             <div className="hidden md:flex items-center relative">
               <Search className={`w-4 h-4 absolute left-3 ${isFocus ? 'text-slate-400' : 'text-slate-600'}`} />
               <input 
                 type="text" 
                 placeholder={isFocus ? "Search..." : "QUERY_DATABASE..."}
                 className={`rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none transition-all w-64 ${
                   isFocus 
                     ? 'bg-stone-100 text-slate-900 focus:ring-2 focus:ring-amplify-purple/20 placeholder-slate-400' 
                     : 'bg-slate-900 border border-slate-700 text-amplify-green focus:border-amplify-green placeholder-slate-700 font-mono'
                 }`}
               />
             </div>
             
             {/* Notifications */}
             <button className={`relative ${isFocus ? 'text-slate-400 hover:text-slate-600' : 'text-slate-600 hover:text-amplify-green'}`}>
               <Bell className="w-5 h-5" />
               <span className={`absolute top-0 right-0 w-2 h-2 rounded-full ${isFocus ? 'bg-rose-500' : 'bg-amplify-green animate-pulse'}`}></span>
             </button>

             {/* Avatar */}
             <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
               isFocus 
                 ? 'bg-stone-200 text-slate-600 border-stone-300' 
                 : 'bg-slate-900 text-amplify-green border-amplify-green shadow-[0_0_10px_rgba(195,253,52,0.2)]'
             }`}>
               AL
             </div>
          </div>
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10 relative">
          <Outlet context={{ mode }} />
          
          {/* Footer */}
          <footer className={`mt-12 text-center text-xs opacity-50 ${isFocus ? 'text-slate-400' : 'text-slate-600 font-mono'}`}>
            &copy; 2025 MAXED MARKETING. {isFocus ? 'Confidential Data.' : '[CLASSIFIED_DATA]'}
          </footer>
        </main>
      </div>
    </div>
  );
};