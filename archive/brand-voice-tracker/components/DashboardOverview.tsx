
import React, { useState, useMemo } from 'react';
import { BrandVoiceData, SubScore } from '../types';
import { TrendingUp, TrendingDown, Minus, Activity, Radio, ArrowRight, BarChart2, Zap, Calendar } from 'lucide-react';
import { DesignMode } from './BrandVoiceTracker';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

interface Props {
  data: BrandVoiceData;
  mode: DesignMode;
}

type TimeRange = 'max' | '90d' | 'mtd';

// Generate simulated chart data with labels based on time range
const generateChartData = (score: number, trend: 'up' | 'down' | 'neutral', range: TimeRange) => {
  const points = 12;
  let labels: string[] = [];

  if (range === 'max') {
    labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  } else if (range === '90d') {
    // Last 90 days - roughly 12 weeks
    labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
  } else {
    // MTD - simplified points
    labels = ['1', '4', '7', '10', '13', '16', '19', '22', '25', '28', '30', 'Now'];
  }

  let current = score;
  const tempValues: number[] = [];

  // Generate data walking backwards from current score
  for (let i = 0; i < points; i++) {
    tempValues.push(current);
    // Random walk
    const change = trend === 'up' ? -(Math.random() * 8) : trend === 'down' ? (Math.random() * 8) : (Math.random() * 6 - 3);
    current = Math.max(30, Math.min(98, current + change));
  }

  const reversedValues = tempValues.reverse();

  return labels.map((label, index) => ({
    name: label,
    value: reversedValues[index]
  }));
};

const TrendIcon = ({ trend, mode }: { trend: 'up' | 'down' | 'neutral', mode: DesignMode }) => {
  const isFocus = mode === 'focus';
  if (trend === 'up') return <TrendingUp className={`w-4 h-4 ${isFocus ? 'text-emerald-500' : 'text-amplify-green'}`} />;
  if (trend === 'down') return <TrendingDown className={`w-4 h-4 ${isFocus ? 'text-rose-500' : 'text-rose-500'}`} />;
  return <Minus className={`w-4 h-4 ${isFocus ? 'text-slate-400' : 'text-slate-600'}`} />;
};

const SubScoreCard = ({ subScore, mode, type, timeRange }: { subScore: SubScore, mode: DesignMode, type: string, timeRange: TimeRange }) => {
  const isFocus = mode === 'focus';
  const chartData = useMemo(() => generateChartData(subScore.score, subScore.trend.trend, timeRange), [subScore.score, subScore.trend.trend, timeRange]);
  
  // Colors for Focus Mode
  const focusColors: Record<string, string> = {
    Search: '#6366f1', // Indigo
    Social: '#ec4899', // Pink
    Reviews: '#f59e0b', // Amber
    Website: '#0ea5e9', // Sky
  };

  const accentColor = focusColors[subScore.name] || '#6366f1';

  if (isFocus) {
    return (
      <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{subScore.name} Intelligence</h3>
             <div className="flex items-baseline gap-3">
               <span className="text-5xl font-bold text-slate-900 tracking-tighter">{subScore.score}</span>
               <div className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg">
                 <TrendIcon trend={subScore.trend.trend} mode={mode} />
                 <span className={`text-xs font-bold ${
                   subScore.trend.trend === 'up' ? 'text-emerald-600' : 
                   subScore.trend.trend === 'down' ? 'text-rose-600' : 'text-slate-500'
                 }`}>
                   {Math.abs(subScore.trend.percentageChange)}%
                 </span>
               </div>
             </div>
          </div>
          <div className="text-right">
             <span className="text-xs font-bold text-slate-400 block mb-1">Impact Weight</span>
             <span className="text-sm font-bold text-slate-900 bg-stone-100 px-3 py-1 rounded-full">
                {subScore.weight}%
             </span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-32 w-full px-4 relative">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
               <defs>
                 <linearGradient id={`gradient-${subScore.name}`} x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor={accentColor} stopOpacity={0.2}/>
                   <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                interval="preserveStartEnd"
                dy={10}
               />
               <Area 
                 type="monotone" 
                 dataKey="value" 
                 stroke={accentColor} 
                 strokeWidth={3} 
                 fillOpacity={1} 
                 fill={`url(#gradient-${subScore.name})`} 
               />
             </AreaChart>
           </ResponsiveContainer>
        </div>

        {/* Details & Action */}
        <div className="p-8 pt-4 mt-auto">
          <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6 line-clamp-2">
            {subScore.details}
          </p>
          <Link 
            to={`/brand-voice/${subScore.slug}`}
            className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all flex items-center justify-center gap-2 group-hover:translate-y-0 translate-y-0"
          >
             <span>Analyze {subScore.name}</span>
             <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  // Executive Mode
  return (
    <div className="bg-slate-900/50 border border-slate-800 hover:border-amplify-green transition-colors group relative overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 right-0 w-2 h-2 bg-slate-800 group-hover:bg-amplify-green transition-colors"></div>
      
      <div className="p-6 pb-2 border-b border-slate-800/50">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-amplify-green text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amplify-green rounded-full animate-pulse"></span>
            {subScore.name}_MODULE
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            WEIGHT: {subScore.weight.toFixed(2)}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-4xl font-mono font-bold text-white tracking-tighter">{subScore.score}</span>
          <div className={`text-xs font-mono ${
             subScore.trend.trend === 'up' ? 'text-amplify-green' : 
             subScore.trend.trend === 'down' ? 'text-rose-500' : 'text-slate-500'
          }`}>
             {subScore.trend.trend === 'up' ? '▲' : subScore.trend.trend === 'down' ? '▼' : '−'} {Math.abs(subScore.trend.percentageChange)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-28 w-full relative bg-slate-950/50 border-b border-slate-800/50 pt-4">
         {/* Grid lines background */}
         <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[length:10px_10px]"></div>
         <ResponsiveContainer width="100%" height="100%">
           <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
             <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                interval="preserveStartEnd"
                dy={5}
             />
             <Area 
               type="step" 
               dataKey="value" 
               stroke="#c3fd34" 
               strokeWidth={1} 
               fillOpacity={0.1} 
               fill="#c3fd34" 
             />
           </AreaChart>
         </ResponsiveContainer>
      </div>

      <div className="p-4 mt-auto">
        <p className="text-xs text-slate-500 font-mono opacity-80 mb-4 border-l-2 border-slate-800 pl-3">
          > {subScore.details}
        </p>
        <Link 
          to={`/brand-voice/${subScore.slug}`}
          className="w-full py-2 border border-amplify-green/30 text-amplify-green font-mono text-xs uppercase hover:bg-amplify-green hover:text-slate-900 transition-all flex items-center justify-center gap-2"
        >
           <Zap className="w-3 h-3" />
           INITIATE_DEEP_DIVE
        </Link>
      </div>
    </div>
  );
};

const BviGauge = ({ value, mode }: { value: number, mode: DesignMode }) => {
  const isFocus = mode === 'focus';
  
  // Data for the gauge
  const data = [
    { name: 'Score', value: value },
    { name: 'Remaining', value: 100 - value }
  ];

  if (isFocus) {
    return (
      <div className="relative h-48 w-full flex items-center justify-center">
         <ResponsiveContainer width="100%" height="100%">
            <PieChart>
               <defs>
                 <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                   <stop offset="0%" stopColor="#6366f1" />
                   <stop offset="100%" stopColor="#c3fd34" />
                 </linearGradient>
               </defs>
               <Pie
                 data={data}
                 cx="50%"
                 cy="70%"
                 startAngle={180}
                 endAngle={0}
                 innerRadius="65%"
                 outerRadius="85%"
                 paddingAngle={0}
                 dataKey="value"
                 stroke="none"
               >
                 <Cell key="score" fill="url(#scoreGradient)" />
                 <Cell key="bg" fill="#f5f5f4" />
               </Pie>
            </PieChart>
         </ResponsiveContainer>
         <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-5xl font-black text-slate-900 tracking-tighter">{value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Index</div>
         </div>
      </div>
    );
  }

  // Executive Gauge
  return (
    <div className="relative h-48 w-full flex items-center justify-center">
       <div className="absolute inset-0 rounded-full border border-slate-800/50 animate-[spin_10s_linear_infinite]"></div>
       <div className="absolute w-[80%] h-[80%] rounded-full border border-dashed border-slate-700 animate-[spin_15s_linear_infinite_reverse]"></div>
       <ResponsiveContainer width="100%" height="100%">
          <PieChart>
             <Pie
               data={data}
               cx="50%"
               cy="50%"
               startAngle={220}
               endAngle={-40}
               innerRadius="70%"
               outerRadius="80%"
               paddingAngle={5}
               dataKey="value"
               stroke="none"
             >
               <Cell key="score" fill="#c3fd34" />
               <Cell key="bg" fill="#1e293b" />
             </Pie>
          </PieChart>
       </ResponsiveContainer>
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center bg-slate-950 p-4 rounded-full border border-slate-800 shadow-[0_0_20px_rgba(195,253,52,0.1)]">
          <div className="text-4xl font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{value}</div>
       </div>
    </div>
  );
}

const DashboardOverview: React.FC<Props> = ({ data, mode }) => {
  const isFocus = mode === 'focus';
  const [timeRange, setTimeRange] = useState<TimeRange>('max');

  return (
    <div className="space-y-8">
      {/* Top Section: BVI & Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main BVI Score - Spiced Up */}
        {isFocus ? (
          // Focus Mode BVI
          <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-xl lg:col-span-1 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-stone-50 to-transparent"></div>
            <h2 className="relative text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 z-10">Overall Health</h2>
            
            <BviGauge value={data.bvi.value} mode={mode} />

            <div className="mt-2 w-full px-8">
               <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
                 <span>Prev: 68</span>
                 <span>Target: 85</span>
               </div>
               <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${data.bvi.value}%` }}></div>
               </div>
               <div className="mt-4 flex justify-center">
                  <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold text-sm">Trending Upwards ({data.bvi.percentageChange}%)</span>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          // Executive Mode BVI
          <div className="bg-slate-900 border border-slate-700 lg:col-span-1 relative p-6 flex flex-col items-center justify-between overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amplify-green to-transparent opacity-50"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(195,253,52,0.05),transparent_70%)]"></div>
            
            <div className="w-full flex justify-between items-center mb-4 z-10">
               <span className="text-[10px] font-mono text-amplify-green tracking-widest">[SYS_MONITOR]</span>
               <Activity className="w-4 h-4 text-amplify-green animate-pulse" />
            </div>

            <BviGauge value={data.bvi.value} mode={mode} />

            <div className="w-full grid grid-cols-2 gap-2 mt-4 z-10">
               <div className="bg-slate-950 border border-slate-800 p-2 text-center">
                  <div className="text-[10px] text-slate-500 font-mono">DELTA_V</div>
                  <div className="text-amplify-green font-mono font-bold">+{data.bvi.percentageChange}%</div>
               </div>
               <div className="bg-slate-950 border border-slate-800 p-2 text-center">
                  <div className="text-[10px] text-slate-500 font-mono">STATUS</div>
                  <div className="text-white font-mono font-bold">OPTIMAL</div>
               </div>
            </div>
          </div>
        )}

        {/* Narrative Summary - Spiced Up */}
        {isFocus ? (
          // Focus Mode Narrative
          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm lg:col-span-2 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-48 h-48 text-amplify-purple" />
            </div>
            
            <div className="p-8 border-b border-stone-100 bg-stone-50/50 backdrop-blur-sm flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-amplify-purple">
                     <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-sm">Intelligence Brief</h3>
                    <p className="text-slate-500 text-xs">AI-Generated • Just now</p>
                  </div>
               </div>
               <button className="text-xs font-bold text-slate-500 hover:text-amplify-purple transition-colors flex items-center gap-1">
                 View History <ArrowRight className="w-3 h-3" />
               </button>
            </div>

            <div className="p-10 flex-1 flex flex-col justify-center">
               <div className="relative">
                  <span className="absolute -top-4 -left-4 text-6xl text-stone-200 font-serif">"</span>
                  <p className="text-slate-700 text-xl leading-relaxed font-medium relative z-10 italic">
                    {data.narrative}
                  </p>
               </div>
            </div>
          </div>
        ) : (
          // Executive Mode Narrative
          <div className="bg-slate-900 border border-slate-800 lg:col-span-2 flex flex-col relative overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-0"></div>
             
             <div className="p-4 border-b border-slate-800 bg-slate-950 z-10 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <Radio className="w-4 h-4 text-amplify-green animate-pulse" />
                 <span className="text-amplify-green font-mono text-xs font-bold tracking-widest">INCOMING_TRANSMISSION</span>
               </div>
               <div className="flex gap-1">
                  <span className="w-2 h-2 bg-amplify-green rounded-full"></span>
                  <span className="w-2 h-2 bg-amplify-green/50 rounded-full"></span>
                  <span className="w-2 h-2 bg-amplify-green/20 rounded-full"></span>
               </div>
             </div>

             <div className="flex-1 p-6 font-mono text-sm text-slate-300 leading-loose z-10 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-slate-900/10 to-slate-900/50 pointer-events-none"></div>
               <span className="text-amplify-green mr-2">root@gemini:~$</span>
               <span className="typing-effect">{data.narrative}</span>
               <span className="inline-block w-2 h-4 bg-amplify-green ml-1 animate-pulse align-middle"></span>
             </div>
          </div>
        )}
      </div>

      {/* Sub-Scores Grid */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
          <h3 className={`font-bold text-lg ${isFocus ? 'text-slate-900' : 'text-white font-mono uppercase tracking-widest'}`}>
            {isFocus ? 'Channel Breakdown' : 'SUBSYSTEM_DIAGNOSTICS'}
          </h3>
          
          {/* Timeline Controls */}
          {isFocus ? (
            <div className="bg-stone-100 p-1 rounded-full flex gap-1">
              {(['max', '90d', 'mtd'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    timeRange === range 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {range === 'max' ? 'Maximum' : range === '90d' ? 'Last 90 Days' : 'Month to Date'}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center font-mono text-xs gap-4 text-slate-500">
               <span>[ TIMEFRAME ]:</span>
               {(['max', '90d', 'mtd'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`uppercase tracking-wider transition-colors hover:text-amplify-green ${
                    timeRange === range ? 'text-amplify-green font-bold' : ''
                  }`}
                >
                  {range === 'max' ? '< MAX >' : range.toUpperCase()}
                </button>
               ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SubScoreCard subScore={data.subScores.search} mode={mode} type="search" timeRange={timeRange} />
          <SubScoreCard subScore={data.subScores.social} mode={mode} type="social" timeRange={timeRange} />
          <SubScoreCard subScore={data.subScores.reviews} mode={mode} type="reviews" timeRange={timeRange} />
          <SubScoreCard subScore={data.subScores.website} mode={mode} type="website" timeRange={timeRange} />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
