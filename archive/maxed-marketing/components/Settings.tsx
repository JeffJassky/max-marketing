import React from 'react';
import { motion } from 'framer-motion';
import { Check, Facebook, Instagram, Linkedin, Youtube, MessageCircle } from 'lucide-react';

interface SettingsProps {
  platforms: Record<string, boolean>;
  onTogglePlatform: (platform: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ platforms, onTogglePlatform }) => {
  const platformList = [
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-100' },
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'tiktok', label: 'TikTok', icon: MessageCircle, color: 'text-black', bg: 'bg-slate-100' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
    { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-2">Manage your connected accounts and preferences.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Platform Selector</h2>
          <p className="text-sm text-slate-500">Select the social media platforms active for your brand.</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformList.map((p) => {
              const isActive = platforms[p.id];
              return (
                <div 
                  key={p.id}
                  onClick={() => onTogglePlatform(p.id)}
                  className={`
                    relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${isActive 
                      ? 'border-indigo-600 bg-indigo-50/30' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-full ${p.bg} ${p.color} flex items-center justify-center mr-4`}>
                    <p.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{p.label}</h3>
                    <p className="text-xs text-slate-400">{isActive ? 'Connected' : 'Not Connected'}</p>
                  </div>
                  
                  <div className={`
                    w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                    ${isActive ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}
                  `}>
                    {isActive && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-colors">
                Save Changes
            </button>
        </div>
      </motion.div>

      {/* Account Teaser */}
      <div className="mt-8 opacity-60 pointer-events-none grayscale select-none">
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Billing & Subscription</h2>
            <div className="h-4 bg-slate-100 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
         </div>
      </div>
    </div>
  );
};