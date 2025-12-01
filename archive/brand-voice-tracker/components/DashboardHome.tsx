import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { DesignMode } from './BrandVoiceTracker';
import { Activity, ArrowUpRight, Users, DollarSign, Target } from 'lucide-react';

interface OutletContextType {
  mode: DesignMode;
}

const StatCard = ({ label, value, trend, icon: Icon, mode }: any) => {
  const isFocus = mode === 'focus';
  
  if (isFocus) {
    return (
      <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-stone-50 rounded-xl text-slate-900">
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
            +{trend}%
          </span>
        </div>
        <h3 className="text-3xl font-bold text-slate-900 mb-1">{value}</h3>
        <p className="text-slate-500 text-sm">{label}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 relative overflow-hidden group hover:border-amplify-green/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <Icon className="w-6 h-6 text-amplify-green" />
        <span className="text-amplify-green font-mono text-xs">
          ▲ {trend}%
        </span>
      </div>
      <h3 className="text-3xl font-mono font-bold text-white mb-1 group-hover:text-amplify-green transition-colors">{value}</h3>
      <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">{label}</p>
    </div>
  );
};

const DashboardHome: React.FC = () => {
  const { mode } = useOutletContext<OutletContextType>();
  const isFocus = mode === 'focus';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard mode={mode} label="Total Revenue" value="$4.2M" trend="12.5" icon={DollarSign} />
        <StatCard mode={mode} label="Active Users" value="84.3k" trend="8.2" icon={Users} />
        <StatCard mode={mode} label="Campaign ROI" value="324%" trend="5.4" icon={Target} />
        <StatCard mode={mode} label="Avg. Session" value="4m 32s" trend="2.1" icon={Activity} />
      </div>

      <div className={`p-8 rounded-[2rem] ${isFocus ? 'bg-white border border-stone-100 shadow-sm' : 'bg-slate-900 border border-slate-800'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-lg font-bold ${isFocus ? 'text-slate-900' : 'text-white font-mono uppercase'}`}>
            Recent Activity
          </h2>
          <button className={`text-sm font-bold flex items-center gap-2 ${isFocus ? 'text-amplify-purple' : 'text-amplify-green font-mono'}`}>
            View All <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${isFocus ? 'bg-stone-50' : 'bg-slate-950 border border-slate-800'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isFocus ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-900 text-amplify-green border border-amplify-green'}`}>
                  {i}
                </div>
                <div>
                  <h4 className={`font-bold ${isFocus ? 'text-slate-900' : 'text-slate-200 font-mono'}`}>Campaign Optimization Complete</h4>
                  <p className={`text-sm ${isFocus ? 'text-slate-500' : 'text-slate-500 font-mono'}`}>System automatically adjusted bid caps for Q3_Launch</p>
                </div>
              </div>
              <span className={`text-xs font-bold ${isFocus ? 'text-slate-400' : 'text-slate-600 font-mono'}`}>2h ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;