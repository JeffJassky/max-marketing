import React, { useState } from 'react';
import { Theme, View, DashboardMetric, ChartDataPoint } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Line, Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Bell, Search, Filter, Calendar, Zap, AlertTriangle, CheckCircle2, Sparkles, Send, Lightbulb, TrendingUp, ShieldCheck, Target, ArrowRight, LayoutGrid, MessageSquare } from 'lucide-react';

interface DashboardProps {
  theme: Theme;
  currentView: View;
  setView: (view: View) => void;
}

// --- Mock Data for Maxed Momentum Chart ---
const dataLifetime = [
  { name: 'Jan', actions: 4, value: 300 },
  { name: 'Feb', actions: 6, value: 850 },
  { name: 'Mar', actions: 8, value: 1600 },
  { name: 'Apr', actions: 5, value: 2100 },
  { name: 'May', actions: 12, value: 3500 },
  { name: 'Jun', actions: 9, value: 4600 },
  { name: 'Jul', actions: 11, value: 6200 },
  { name: 'Aug', actions: 7, value: 7100 },
  { name: 'Sep', actions: 14, value: 9500 },
];

const dataYTD = [
  { name: 'Jan', actions: 4, value: 300 },
  { name: 'Feb', actions: 6, value: 850 },
  { name: 'Mar', actions: 8, value: 1600 },
  { name: 'Apr', actions: 5, value: 2100 },
  { name: 'May', actions: 12, value: 3500 },
];

const data90d = [
  { name: 'Wk 1', actions: 2, value: 120 },
  { name: 'Wk 2', actions: 4, value: 450 },
  { name: 'Wk 3', actions: 3, value: 680 },
  { name: 'Wk 4', actions: 6, value: 1200 },
  { name: 'Wk 5', actions: 5, value: 1650 },
  { name: 'Wk 6', actions: 8, value: 2400 },
];

export const Dashboard: React.FC<DashboardProps> = ({ theme, currentView, setView }) => {
  const isFocus = theme === 'focus';
  
  // State for Chart Range
  const [timeRange, setTimeRange] = useState<'lifetime' | 'ytd' | '90d'>('lifetime');

  // Select data based on range
  const currentChartData = 
    timeRange === 'lifetime' ? dataLifetime : 
    timeRange === 'ytd' ? dataYTD : data90d;

  // --- Sub-Components for Header ---
  const Header = () => (
    <header className="h-16 flex-shrink-0 bg-amplify-dark border-b border-slate-800 px-8 flex justify-between items-center z-10">
      <div className="flex items-center gap-4">
        <h2 className={`text-lg text-white ${isFocus ? 'font-sans font-semibold' : 'font-mono tracking-wide'}`}>
          {currentView === 'dashboard' && (isFocus ? 'My Momentum' : 'CMD_CENTER_V2')}
          {currentView === 'brand-voice' && (isFocus ? 'Brand Voice Tracker' : 'VOICE_ANALYSIS_LOG')}
          {currentView === 'google-ads' && (isFocus ? 'Google Ads Suite' : 'G_ADS_PROTOCOL')}
          {currentView === 'social-spark' && (isFocus ? 'Social Spark' : 'SOCIAL_GEN_MODULE')}
        </h2>
        {!isFocus && (
           <span className="px-2 py-0.5 bg-amplify-green/10 text-amplify-green text-[10px] font-mono border border-amplify-green/20">LIVE_DATA</span>
        )}
      </div>
      <div className="flex gap-4 items-center">
        <div className="hidden md:flex items-center bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700">
          <Search size={16} className={`${isFocus ? 'text-amplify-purple' : 'text-slate-400'} mr-2`} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-32 focus:w-48 transition-all"
          />
        </div>
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amplify-green rounded-full"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white">
          AL
        </div>
      </div>
    </header>
  );

  // --- VIEW: DASHBOARD (Home) ---
  const DashboardView = () => {
    if (isFocus) {
      // L3 Focus Dashboard - The "Momentum & Priority" Layout
      return (
        <div className="p-8 font-sans animate-in fade-in duration-500 overflow-y-auto h-full pb-20">
           
           {/* 1. Header: Personal & Motivational */}
           <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Ready to win the week, Alex?</h1>
              <p className="text-slate-500 mt-1 max-w-2xl">
                You've unlocked <span className="font-bold text-amplify-purple">$9,500</span> in lifetime value.
                We found <span className="font-bold text-slate-800">1 high-impact action</span> for you today.
              </p>
            </div>
            <div className="text-[10px] text-amplify-purple font-mono">Design ID: L3-MOMENTUM</div>
          </div>

          {/* 2. Top Section: The Momentum Chart (Showcasing Success) */}
          <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={20} className="text-amplify-green fill-amplify-green/20" />
                  Maxed Momentum
                </h3>
                <p className="text-xs text-slate-400">
                  {timeRange === 'lifetime' && 'Your cumulative value unlocked since joining Maxed.'}
                  {timeRange === 'ytd' && 'Value unlocked since January 1st.'}
                  {timeRange === '90d' && 'Recent optimization impact (Last 90 Days).'}
                </p>
              </div>
              
              {/* Chart Time Range Controls */}
              <div className="flex bg-stone-100 p-1 rounded-xl">
                 <button 
                    onClick={() => setTimeRange('lifetime')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === 'lifetime' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   Lifetime
                 </button>
                 <button 
                    onClick={() => setTimeRange('ytd')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === 'ytd' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   Year to Date
                 </button>
                 <button 
                    onClick={() => setTimeRange('90d')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === '90d' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   Last 90 Days
                 </button>
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={currentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'Value ($)') return [`$${value}`, name];
                      return [value, name];
                    }}
                  />
                  <Bar yAxisId="left" dataKey="actions" name="Optimizations" fill="#c3fd34" radius={[4, 4, 0, 0]} barSize={timeRange === 'lifetime' ? 20 : 30} />
                  <Line yAxisId="right" type="monotone" dataKey="value" name="Value ($)" stroke="#7c3aed" strokeWidth={3} dot={{r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff'}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* 3. Main Area: The Focus Stream (Prioritization) */}
             <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Priority Focus</h3>
                
                {/* HERO CARD - The #1 Priority */}
                <div className="bg-white rounded-2xl p-1 shadow-sm border border-stone-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amplify-purple"></div>
                  <div className="p-6 pl-8">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-2">
                          <span className="bg-amplify-purple/10 text-amplify-purple px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">Top Priority</span>
                          <span className="text-slate-400 text-xs flex items-center gap-1"><Target size={12}/> Google Ads Suite</span>
                       </div>
                       <div className="text-right">
                          <div className="text-xs text-slate-400 font-medium">Potential Impact</div>
                          <div className="text-lg font-bold text-green-600">+$420.00<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                       </div>
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 mb-2">Negative Keyword Opportunity</h4>
                    <p className="text-slate-500 mb-6 max-w-lg leading-relaxed">
                      We've detected high spend on the term "free guitars" which has a 95% bounce rate. Blocking this will improve your ROAS immediately.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                       <button className="bg-amplify-purple text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amplify-purple/20 hover:bg-amplify-purple/90 transition-all flex items-center gap-2">
                         Fix This Now <ArrowUpRight size={16} />
                       </button>
                       <button className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-stone-50 transition-colors">
                         View Details
                       </button>
                       {/* Tertiary Link */}
                       <div className="flex-1 text-right">
                         <button 
                           onClick={() => setView('google-ads')}
                           className="text-xs font-semibold text-slate-400 hover:text-amplify-purple transition-colors inline-flex items-center gap-1"
                         >
                           See all 3 Google Ads opportunities <ArrowRight size={12} />
                         </button>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Up Next / On Deck Section */}
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-8">Up Next</h3>
                <div className="space-y-3">
                  
                  {/* Item 1: Facebook Ads (Value Driven) */}
                  <div className="bg-white rounded-2xl p-4 border border-stone-100 flex items-center justify-between hover:border-amplify-green transition-colors cursor-pointer group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <LayoutGrid size={20} />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-700 group-hover:text-amplify-purple transition-colors">Facebook Ads: Low Efficiency</h5>
                          <p className="text-xs text-slate-400">Ad Set "Winter Promo" is underperforming.</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                           <div className="text-[10px] text-slate-400 font-bold uppercase">Potential Impact</div>
                           <div className="text-sm font-bold text-green-600">+$185.00/mo</div>
                        </div>
                        <button className="p-2 text-slate-300 hover:text-amplify-green transition-colors">
                          <ArrowUpRight size={20} />
                        </button>
                     </div>
                  </div>

                  {/* Item 2: Social Spark (Creative Task) */}
                  <div className="bg-white rounded-2xl p-4 border border-stone-100 flex items-center justify-between hover:border-amplify-green transition-colors cursor-pointer group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-amplify-purple flex items-center justify-center">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-700 group-hover:text-amplify-purple transition-colors">Social Spark: Event Post</h5>
                          <p className="text-xs text-slate-400">Create a post for your upcoming weekend sale.</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                           <div className="text-[10px] text-slate-400 font-bold uppercase">Value</div>
                           <div className="text-sm font-bold text-slate-600">Engagement</div>
                        </div>
                        <button className="p-2 text-slate-300 hover:text-amplify-green transition-colors">
                          <ArrowUpRight size={20} />
                        </button>
                     </div>
                  </div>

                  {/* Item 3: Local SEO (Reputation) */}
                  <div className="bg-white rounded-2xl p-4 border border-stone-100 flex items-center justify-between hover:border-amplify-green transition-colors cursor-pointer group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Target size={20} />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-700 group-hover:text-amplify-purple transition-colors">Local SEO: 5-Star Review</h5>
                          <p className="text-xs text-slate-400">New review from "John D." requires response.</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                         <div className="text-right hidden sm:block">
                           <div className="text-[10px] text-slate-400 font-bold uppercase">Value</div>
                           <div className="text-sm font-bold text-slate-600">Reputation</div>
                        </div>
                        <button className="p-2 text-slate-300 hover:text-amplify-green transition-colors">
                          <ArrowUpRight size={20} />
                        </button>
                     </div>
                  </div>

                </div>
             </div>

             {/* 4. Sidebar: App Status (The Library) */}
             <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Active Apps</h3>
                
                <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm space-y-6">
                   
                   {/* Google Ads Status */}
                   <div className="flex items-start gap-4 pb-6 border-b border-stone-50">
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm">Google Ads Suite</h4>
                        <p className="text-xs text-slate-400 mt-1">Optimization Score: <span className="text-green-600 font-bold">84%</span></p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Last check: 20m ago</p>
                      </div>
                   </div>

                   {/* Social Spark Status */}
                   <div className="flex items-start gap-4 pb-6 border-b border-stone-50">
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm">Social Spark</h4>
                        <p className="text-xs text-slate-400 mt-1">Ready for input</p>
                      </div>
                   </div>

                   {/* SEO Status */}
                   <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm">Local SEO</h4>
                        <p className="text-xs text-slate-400 mt-1">1 Review needs response</p>
                      </div>
                   </div>

                   <button className="w-full py-3 mt-4 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-400 hover:text-amplify-purple hover:border-amplify-purple transition-colors flex items-center justify-center gap-2">
                     <Zap size={14} /> Add New Mini-App
                   </button>
                </div>

                <div className="bg-amplify-purple/5 p-6 rounded-[2rem] border border-amplify-purple/10">
                   <h4 className="font-bold text-amplify-purple text-sm mb-2">Did you know?</h4>
                   <p className="text-xs text-slate-600 leading-relaxed">
                     Optimizing your negative keywords once a week can save up to 20% of your ad budget. You're doing great!
                   </p>
                </div>
             </div>
          </div>
        </div>
      );
    } else {
      // D3 Executive Dashboard - The "Command Log" Layout
      return (
        <div className="p-6 text-slate-200 font-mono animate-in fade-in duration-500 overflow-y-auto h-full">
           <div className="flex justify-between items-end mb-6">
             <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-amplify-green"></div>
                  <h2 className="text-xl font-mono tracking-widest text-white uppercase">Command_Center</h2>
                </div>
                <p className="text-xs text-slate-500 font-mono pl-3">OPTIMIZATION_PROTOCOL // ACTIVE</p>
             </div>
             <div className="text-right">
                <div className="text-[10px] text-slate-500">TOTAL_VALUE_RECOVERED</div>
                <div className="text-2xl font-bold text-amplify-green">$9,500.00</div>
             </div>
           </div>
          
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Chart Section */}
            <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 p-6 min-h-[300px] relative">
               <div className="absolute top-0 right-0 p-2 text-xs text-slate-700 font-mono">EFFICIENCY_VECTOR_PLOT</div>
               <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={currentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis yAxisId="left" tick={{fill: '#64748b', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{fill: '#64748b', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} itemStyle={{color: '#fff'}} />
                    <Bar yAxisId="left" dataKey="actions" fill="#334155" barSize={20} />
                    <Line yAxisId="right" type="step" dataKey="value" stroke="#c3fd34" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Status / Mini Apps */}
            <div className="bg-slate-900/50 border border-slate-800 p-4">
                <h3 className="text-xs font-mono text-white uppercase tracking-widest mb-4">Module_Status</h3>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center bg-slate-800/50 p-2 border border-slate-700">
                    <span className="text-slate-300">G_ADS</span>
                    <span className="text-amplify-green">[OPTIMIZED]</span>
                  </div>
                   <div className="flex justify-between items-center bg-slate-800/50 p-2 border border-slate-700">
                    <span className="text-slate-300">SOC_SPARK</span>
                    <span className="text-slate-500">[IDLE]</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/50 p-2 border border-slate-700">
                    <span className="text-slate-300">LOC_SEO</span>
                    <span className="text-yellow-500">[ATTN_REQ]</span>
                  </div>
                </div>
            </div>

            {/* Priority Queue (Replacing Metrics) */}
            <div className="lg:col-span-4 mt-4">
               <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                 <AlertTriangle size={16} className="text-amplify-secondary" />
                 <h3 className="text-sm font-mono text-white uppercase">Priority_Queue</h3>
               </div>
               
               <div className="bg-slate-900/80 border border-l-4 border-slate-800 border-l-amplify-secondary p-4 flex justify-between items-center group hover:bg-slate-800 transition-colors cursor-pointer">
                  <div>
                     <div className="flex gap-2 text-[10px] mb-1">
                        <span className="text-amplify-secondary font-bold">PRIORITY_01</span>
                        <span className="text-slate-500">SOURCE: G_ADS</span>
                     </div>
                     <h4 className="text-white font-bold text-sm">NEGATIVE_KEYWORD_DETECTED</h4>
                     <p className="text-slate-400 text-xs mt-1">Analysis indicates 'free guitars' driving waste.</p>
                  </div>
                  <div className="flex items-center gap-6">
                     <div className="text-right">
                        <div className="text-[10px] text-slate-500">EST_RECOVERY</div>
                        <div className="text-amplify-green font-bold">+$420.00</div>
                     </div>
                     <button className="bg-slate-800 border border-slate-600 text-white px-4 py-2 text-xs font-bold hover:bg-amplify-secondary hover:border-amplify-secondary transition-colors">
                        INITIATE_FIX
                     </button>
                  </div>
               </div>
            </div>

          </div>
        </div>
      );
    }
  };

  // --- VIEW: GOOGLE ADS SUITE ---
  const GoogleAdsView = () => {
    const tabs = ['Overview', 'Opportunities', 'Waste Watch', 'Roadmap'];
    const [activeTab, setActiveTab] = useState('Overview');

    if (isFocus) {
      // L3 Focus Google Ads
      return (
        <div className="p-8 font-sans h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Campaign Management</h1>
              <p className="text-slate-500 mt-1">Manage and optimize your Google Ads performance.</p>
            </div>
             <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-colors">
               Create Campaign
             </button>
          </div>

          {/* L3 Tab Design - Redesigned for Clarity & Progress */}
          <div className="flex flex-wrap gap-3 mb-8 filter drop-shadow-sm">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    relative h-14 pl-8 pr-12 flex items-center transition-all duration-300 group cursor-pointer
                    ${isActive 
                      ? 'bg-amplify-purple text-white z-10' 
                      : 'bg-white text-slate-500 hover:text-slate-800 hover:bg-stone-50'
                    }
                  `}
                  style={{
                    // Creates an arrow shape pointing right: Flat left, arrow point right
                    clipPath: 'polygon(0% 0%, calc(100% - 16px) 0%, 100% 50%, calc(100% - 16px) 100%, 0% 100%)'
                  }}
                >
                  <span className={`text-base font-bold tracking-tight ${isActive ? 'text-white' : ''}`}>
                      {tab}
                  </span>
                  
                  {/* Notification Badge */}
                  {tab === 'Opportunities' && (
                    <span className={`absolute top-3 right-8 flex h-3 w-3`}>
                       <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-amplify-green' : 'bg-amplify-purple'}`}></span>
                       <span className={`relative inline-flex rounded-full h-3 w-3 ${isActive ? 'bg-amplify-green' : 'bg-amplify-purple'}`}></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content - Opportunities Mockup */}
          <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm flex-1 p-8 overflow-y-auto">
             <div className="max-w-4xl">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-full bg-amplify-purple/10 flex items-center justify-center text-amplify-purple">
                   <Zap size={24} />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-slate-800">2 High Priority Opportunities</h3>
                   <p className="text-slate-500 text-sm">Actioning these could save you <span className="text-green-600 font-bold">$420/mo</span>.</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="border border-stone-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                       <div>
                         <div className="flex items-center gap-2 mb-2">
                           <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100">WASTE DETECTED</span>
                           <span className="text-slate-400 text-xs">Google Ads</span>
                         </div>
                         <h4 className="font-bold text-lg text-slate-800">Negative Keyword Suggestion</h4>
                         <p className="text-slate-500 text-sm mt-1 max-w-xl">
                           The term "free guitars" is driving traffic with 95% bounce rate. Add as negative keyword?
                         </p>
                       </div>
                       <div className="text-right">
                         <div className="text-xl font-bold text-slate-800">$240.50</div>
                         <div className="text-xs text-slate-400">Wasted Spend</div>
                       </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                       <button className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                         Block this Word
                       </button>
                       <button className="text-slate-500 px-5 py-2 text-sm font-medium hover:text-slate-700">
                         Dismiss
                       </button>
                    </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      );
    } else {
      // D3 Executive Google Ads
      return (
        <div className="p-6 font-mono h-full flex flex-col text-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-mono tracking-wide uppercase">Ads_Manager.exe</h1>
            <div className="flex gap-2">
               <span className="bg-slate-800 border border-slate-700 px-3 py-1 text-xs flex items-center gap-2">
                 STATUS: <span className="text-amplify-green">ACTIVE</span>
               </span>
            </div>
          </div>

          {/* D3 Tab Design */}
          <div className="flex border-b border-slate-700 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-xs font-mono tracking-wider border-r border-t border-slate-700 transition-colors ${
                  activeTab === tab 
                  ? 'bg-slate-800 text-amplify-green border-t-2 border-t-amplify-green' 
                  : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                {tab.toUpperCase()}
                {tab === 'Opportunities' && <span className="ml-2 text-amplify-secondary">[2]</span>}
              </button>
            ))}
            <div className="flex-1 bg-slate-900/50 border-b border-slate-700"></div>
          </div>

          {/* Content */}
          <div className="border border-slate-700 bg-slate-900/30 p-6 flex-1 relative">
             <div className="absolute top-0 right-0 p-2 text-[10px] text-slate-600">PANEL_VIEW_02</div>
             
             <div className="flex gap-4 items-center mb-6">
               <AlertTriangle className="text-amplify-secondary" size={20} />
               <h3 className="text-sm font-mono uppercase text-white"> optimization_required</h3>
             </div>

             <div className="border border-red-900/50 bg-red-900/10 p-4 mb-4">
               <div className="flex justify-between items-start mb-2">
                  <span className="text-red-400 text-xs font-bold">[CRITICAL_ALERT]</span>
                  <span className="text-slate-500 text-xs">ID: #9928</span>
               </div>
               <p className="text-sm text-slate-300 mb-4">Detected inefficient spend vector. Keyword "free" causing ROAS degradation.</p>
               <div className="flex items-center gap-4 bg-slate-950 p-3 border border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500">WASTE_VAL</span>
                    <span className="text-lg text-white font-bold">$240.50</span>
                  </div>
                  <div className="h-8 w-px bg-slate-800"></div>
                  <button className="flex-1 bg-red-600/20 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-colors py-1 text-xs font-bold uppercase">
                    EXECUTE_BLOCK
                  </button>
               </div>
             </div>
          </div>
        </div>
      );
    }
  };

  // --- VIEW: BRAND VOICE TRACKER ---
  const BrandVoiceView = () => {
    if (isFocus) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-stone-50 animate-in fade-in duration-500 text-center">
            <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm border border-stone-100 flex items-center justify-center text-amplify-purple mb-6">
                <MessageSquare size={40} />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Brand Voice Tracker</h1>
            <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
              We're building a dedicated space to track, analyze, and perfect your brand's voice across every channel.
            </p>
            <div className="mt-8 px-4 py-2 bg-amplify-purple/10 text-amplify-purple rounded-full text-sm font-bold">
              Coming Soon
            </div>
        </div>
      );
    } else {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-amplify-darker font-mono animate-in fade-in duration-500 text-slate-400">
            <div className="border border-slate-800 p-8 bg-slate-900/50 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-2 h-2 bg-yellow-500 animate-pulse"></div>
                   <span className="text-yellow-500 tracking-widest uppercase">Construction_Mode</span>
                </div>
                <h1 className="text-2xl text-white mb-2">VOICE_TRACKER.mod</h1>
                <p className="text-xs max-w-md text-center">
                   MODULE INITIALIZATION PENDING. 
                   DATA STREAM NOT ESTABLISHED.
                </p>
            </div>
        </div>
      );
    }
  };

  // --- VIEW: SOCIAL SPARK ---
  const SocialSparkView = () => {
    if (isFocus) {
       // L3 Focus Social Spark
       return (
         <div className="h-full flex flex-col items-center justify-center p-8 bg-stone-50 font-sans animate-in fade-in duration-500">
            <div className="max-w-2xl w-full">
               <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-stone-100 mx-auto flex items-center justify-center text-amplify-purple mb-6">
                    <Sparkles size={32} />
                 </div>
                 <h1 className="text-4xl font-bold text-slate-800 mb-3">Spark your next big idea.</h1>
                 <p className="text-slate-500 text-lg">What specific product or event do you want to post about?</p>
               </div>

               <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-stone-100">
                  <textarea 
                    className="w-full h-32 p-6 rounded-[1.5rem] bg-stone-50 border-none outline-none resize-none text-slate-700 placeholder-slate-400 text-lg focus:bg-white focus:ring-2 focus:ring-amplify-purple/20 transition-all"
                    placeholder="e.g. A summer sale for our new organic coffee blend..."
                  />
                  <div className="flex justify-between items-center px-4 pb-2 pt-2">
                    <button className="p-2 text-slate-400 hover:text-amplify-purple transition-colors">
                      <Lightbulb size={20} />
                    </button>
                    <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-amplify-purple hover:shadow-lg hover:shadow-amplify-purple/20 transition-all flex items-center gap-2">
                      Generate Ideas <ArrowUpRight size={16} />
                    </button>
                  </div>
               </div>
               
               <div className="mt-8 flex justify-center gap-4">
                  <span className="px-4 py-1 bg-white border border-stone-200 rounded-full text-xs font-bold text-slate-500 cursor-pointer hover:border-amplify-green hover:text-slate-800 transition-colors">New Arrival</span>
                  <span className="px-4 py-1 bg-white border border-stone-200 rounded-full text-xs font-bold text-slate-500 cursor-pointer hover:border-amplify-green hover:text-slate-800 transition-colors">Flash Sale</span>
                  <span className="px-4 py-1 bg-white border border-stone-200 rounded-full text-xs font-bold text-slate-500 cursor-pointer hover:border-amplify-green hover:text-slate-800 transition-colors">Event</span>
               </div>
            </div>
         </div>
       );
    } else {
       // D3 Executive Social Spark
       return (
         <div className="h-full flex flex-col p-12 bg-amplify-darker font-mono text-slate-200 animate-in fade-in duration-500">
            <div className="max-w-3xl w-full mx-auto border border-slate-700 bg-slate-900/50 p-1">
               <div className="bg-slate-800 px-4 py-1 flex justify-between items-center text-[10px] text-slate-400 mb-1">
                  <span>SOCIAL_GEN_MODULE.sh</span>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                  </div>
               </div>
               
               <div className="p-8 min-h-[400px] flex flex-col">
                  <div className="text-slate-500 mb-6 text-sm">
                    > INITIALIZING CREATIVE MATRIX... <span className="text-amplify-green">DONE</span><br/>
                    > WAITING FOR INPUT PARAMETERS...
                  </div>

                  <div className="flex gap-2 text-lg mb-4">
                     <span className="text-amplify-secondary font-bold">></span>
                     <span className="text-white font-bold">INPUT_TOPIC:</span>
                  </div>

                  <textarea 
                    className="w-full flex-1 bg-transparent border-none outline-none resize-none text-amplify-green font-mono text-lg placeholder-slate-700 focus:ring-0"
                    placeholder="ENTER_DATA_HERE..."
                    autoFocus
                  />
                  
                  <div className="border-t border-slate-700 pt-6 flex justify-end">
                     <button className="bg-amplify-green text-amplify-darker px-6 py-3 font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors flex items-center gap-2">
                       <Zap size={16} /> Execute_Gen
                     </button>
                  </div>
               </div>
            </div>
         </div>
       );
    }
  };

  // --- Main Render Switch ---
  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${isFocus ? 'bg-stone-50' : 'bg-amplify-darker'}`}>
      <Header />
      <main className="flex-1 overflow-hidden relative">
         {currentView === 'dashboard' && <DashboardView />}
         {currentView === 'brand-voice' && <BrandVoiceView />}
         {currentView === 'google-ads' && <GoogleAdsView />}
         {currentView === 'social-spark' && <SocialSparkView />}
      </main>
    </div>
  );
};