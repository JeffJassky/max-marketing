
import React, { useState } from 'react';
import { BrandVoiceData } from '../types';
import { COMPETITOR_TRENDS } from '../constants';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import { Zap, Users, Globe, Hash, Settings, Users as UsersIcon } from 'lucide-react';
import { DesignMode } from './BrandVoiceTracker';

interface Props {
  data: BrandVoiceData;
  mode: DesignMode;
}

const CustomTooltip = ({ active, payload, label, mode }: any) => {
  const isFocus = mode === 'focus';
  if (active && payload && payload.length) {
    return (
      <div className={`${isFocus ? 'bg-white border-stone-100 shadow-xl rounded-xl' : 'bg-slate-900 border-amplify-green shadow-none rounded-none'} border p-4`}>
        <p className={`${isFocus ? 'text-slate-900' : 'text-amplify-green font-mono'} font-bold mb-2`}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className={`flex items-center gap-2 text-sm ${!isFocus && 'font-mono'}`}>
            <span className="w-2 h-2" style={{ backgroundColor: entry.color, borderRadius: isFocus ? '50%' : '0' }}></span>
            <span className={`${isFocus ? 'text-slate-500' : 'text-slate-400'}`}>{entry.name}:</span>
            <span className={`${isFocus ? 'text-slate-900' : 'text-white'} font-bold`}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MetricTile = ({ label, value, change, icon: Icon, colorClass, mode }: any) => {
  const isFocus = mode === 'focus';
  
  if (isFocus) {
    return (
      <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col justify-between h-40 group hover:shadow-lg transition-all">
        <div className="flex justify-between items-start">
           <div className={`p-3 rounded-2xl ${colorClass.bg}`}>
             <Icon className={`w-6 h-6 ${colorClass.text}`} />
           </div>
           <p className={`text-xs font-bold ${change > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2 py-1 rounded-lg`}>
             {change > 0 ? '+' : ''}{change}%
           </p>
        </div>
        <div>
           <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
           <p className="text-slate-500 text-sm font-medium">{label}</p>
        </div>
      </div>
    );
  }

  // Executive Metric Tile
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 flex items-center justify-between relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 group-hover:bg-amplify-green transition-colors"></div>
      <div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-3xl font-mono font-bold text-white group-hover:text-amplify-green transition-colors">{value}</h3>
      </div>
      <div className="text-right">
         <p className={`text-xs font-mono ${change > 0 ? 'text-amplify-green' : 'text-rose-500'}`}>
            {change > 0 ? '▲' : '▼'} {Math.abs(change)}%
         </p>
      </div>
    </div>
  );
};

const DeepDive: React.FC<Props> = ({ data, mode }) => {
  const isFocus = mode === 'focus';
  const [showCompetitors, setShowCompetitors] = useState({
    me: true,
    comp1: true,
    comp2: true
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Proprietary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricTile 
          mode={mode}
          label={isFocus ? "Total Search Velocity" : "SEARCH_VELOCITY_INDEX"} 
          value={data.deepDive.totalSearchVelocity.value.toLocaleString()} 
          change={data.deepDive.totalSearchVelocity.percentageChange}
          icon={Zap}
          colorClass={{ bg: 'bg-amber-100', text: 'text-amber-600' }}
        />
        <MetricTile 
           mode={mode}
          label={isFocus ? "Total Social Views" : "SOCIAL_IMPRESSION_COUNT"}
          value={(data.deepDive.socialViews.value / 1000000).toFixed(2) + 'M'} 
          change={data.deepDive.socialViews.percentageChange}
          icon={Users}
          colorClass={{ bg: 'bg-pink-100', text: 'text-pink-600' }}
        />
        <MetricTile 
           mode={mode}
          label={isFocus ? "Website Traffic" : "WEB_TRAFFIC_LOG"}
          value={(data.deepDive.websiteTraffic.value / 1000).toFixed(1) + 'k'} 
          change={data.deepDive.websiteTraffic.percentageChange}
          icon={Globe}
          colorClass={{ bg: 'bg-sky-100', text: 'text-sky-600' }}
        />
      </div>

      {/* Voice vs Goliath Radar Section */}
      <div className={`${isFocus ? 'bg-white rounded-[2.5rem] border-stone-100 shadow-lg' : 'bg-slate-900 border-slate-800'} border p-8 transition-all`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
           <div>
              <h3 className={`text-xl font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono uppercase'}`}>
                 {isFocus ? 'Voice vs. Goliath Radar' : 'COMPETITOR_VECTOR_ANALYSIS'}
              </h3>
              <p className={isFocus ? 'text-slate-500 text-sm mt-1' : 'text-slate-500 font-mono text-xs mt-1'}>
                 Qualitative comparison of brand attributes.
              </p>
           </div>
           
           {/* Competitor Controls */}
           <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button 
                onClick={() => setShowCompetitors(p => ({...p, comp1: !p.comp1}))}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${showCompetitors.comp1 ? (isFocus ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-800 border-slate-600 text-slate-300') : 'opacity-50'}`}
              >
                {showCompetitors.comp1 ? 'Hide' : 'Show'} Sweetwater
              </button>
              <button 
                onClick={() => setShowCompetitors(p => ({...p, comp2: !p.comp2}))}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${showCompetitors.comp2 ? (isFocus ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-800 border-slate-600 text-slate-300') : 'opacity-50'}`}
              >
                {showCompetitors.comp2 ? 'Hide' : 'Show'} Guitar Center
              </button>
              <button className={`p-2 rounded-full ${isFocus ? 'bg-stone-100 text-slate-600 hover:bg-stone-200' : 'bg-slate-800 text-amplify-green border border-amplify-green/30'}`}>
                <Settings className="w-4 h-4" />
              </button>
           </div>
        </div>

        <div className="h-[400px] w-full flex items-center justify-center">
           <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.competitorRadar}>
                <PolarGrid stroke={isFocus ? '#e5e7eb' : '#334155'} />
                <PolarAngleAxis dataKey="attribute" tick={{ fill: isFocus ? '#64748b' : '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                
                {/* Me */}
                <Radar
                  name="George's Music"
                  dataKey="me"
                  stroke={isFocus ? '#6366f1' : '#c3fd34'}
                  strokeWidth={3}
                  fill={isFocus ? '#6366f1' : '#c3fd34'}
                  fillOpacity={0.3}
                />
                
                {/* Competitor 1 - Sweetwater */}
                {showCompetitors.comp1 && (
                  <Radar
                    name="Sweetwater"
                    dataKey="competitor1"
                    stroke={isFocus ? '#f43f5e' : '#f43f5e'}
                    strokeWidth={2}
                    fill={isFocus ? '#f43f5e' : '#f43f5e'}
                    fillOpacity={0.1}
                  />
                )}

                {/* Competitor 2 - Guitar Center */}
                {showCompetitors.comp2 && (
                  <Radar
                    name="Guitar Center"
                    dataKey="competitor2"
                    stroke={isFocus ? '#10b981' : '#10b981'}
                    strokeWidth={2}
                    fill={isFocus ? '#10b981' : '#10b981'}
                    fillOpacity={0.1}
                  />
                )}
                <Legend iconType={isFocus ? 'circle' : 'rect'} wrapperStyle={{ fontFamily: isFocus ? 'inherit' : 'monospace', fontSize: '12px', paddingTop: '20px' }} />
                <Tooltip content={<CustomTooltip mode={mode} />} />
              </RadarChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Main Trends Section */}
      <div className={`${isFocus ? 'bg-white rounded-[2.5rem] border-stone-100 shadow-lg' : 'bg-slate-900 border-slate-800'} border p-8 transition-all`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h3 className={`text-lg font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono uppercase'}`}>
              {isFocus ? 'Mention Volume History' : 'COMPETITOR_VECTOR_STREAM [12M]'}
            </h3>
            <p className={`${isFocus ? 'text-slate-500' : 'text-slate-500 font-mono text-xs'} mt-1`}>
              {isFocus ? 'Comparative view of brand mentions across LLM databases.' : 'TRACKING_ID: G-MUSIC vs SECTOR_AVERAGE'}
            </p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {isFocus ? (
              // Focus Mode: Smooth Area Chart
              <AreaChart data={COMPETITOR_TRENDS} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGeorge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Area type="monotone" dataKey="georgesMusic" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorGeorge)" />
                <Area type="monotone" dataKey="sweetwater" stroke="#f43f5e" strokeWidth={2} fill="transparent" strokeDasharray="4 4" opacity={0.5} />
                <Area type="monotone" dataKey="guitarCenter" stroke="#10b981" strokeWidth={2} fill="transparent" strokeDasharray="4 4" opacity={0.5} />
              </AreaChart>
            ) : (
              // Executive Mode: Step Line Chart
              <LineChart data={COMPETITOR_TRENDS} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="1 1" vertical={true} />
                <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} dy={10} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ stroke: '#c3fd34', strokeWidth: 1 }} />
                <Line type="stepAfter" dataKey="georgesMusic" stroke="#c3fd34" strokeWidth={2} dot={{ fill: '#020617', stroke: '#c3fd34', strokeWidth: 2, r: 4, shape: 'rect' }} activeDot={{ r: 6, fill: '#c3fd34' }} />
                <Line type="stepAfter" dataKey="sweetwater" stroke="#94a3b8" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                <Line type="stepAfter" dataKey="guitarCenter" stroke="#64748b" strokeWidth={1} dot={false} strokeDasharray="4 4" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DeepDive;
