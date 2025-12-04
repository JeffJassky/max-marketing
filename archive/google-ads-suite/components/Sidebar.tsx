import React from 'react';
import { LayoutDashboard, BarChart3, Sparkles, MapPin, Settings, Lock, X } from 'lucide-react';
import { AppView } from '../types';
import { motion } from 'framer-motion';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLockedItemClick: (viewId: AppView, label: string) => void;
  unlockedItems: AppView[];
  className?: string;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  onLockedItemClick, 
  unlockedItems = [], 
  className = '',
  onClose
}) => {
  
  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'LayoutDashboard': return <LayoutDashboard className={className} />;
      case 'BarChart3': return <BarChart3 className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'MapPin': return <MapPin className={className} />;
      case 'Settings': return <Settings className={className} />;
      default: return null;
    }
  };

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: 'LayoutDashboard', locked: false },
    { id: AppView.GOOGLE_ADS, label: 'Google Ads Suite', icon: 'BarChart3', locked: false },
    { id: AppView.SOCIAL_SPARK, label: 'Social Spark', icon: 'Sparkles', locked: true },
    { id: AppView.LOCAL_SEO, label: 'Local SEO', icon: 'MapPin', locked: true },
    { id: AppView.SETTINGS, label: 'Settings', icon: 'Settings', locked: false },
  ];

  return (
    <aside className={`flex flex-col h-full bg-slate-900 text-slate-300 ${className}`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950 flex-shrink-0">
        <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-white tracking-tight">Maxed Marketing</span>
        </div>
        {/* Mobile Close Button */}
        <button 
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
        >
            <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          // Item is effectively locked only if it's marked locked AND not in the unlockedItems list
          const isLocked = item.locked && !unlockedItems.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => {
                  if (isLocked) {
                      onLockedItemClick(item.id, item.label);
                  } else {
                      onChangeView(item.id);
                      if (onClose) onClose(); // Close sidebar on mobile selection
                  }
              }}
              className={`
                group flex items-center w-full px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 relative
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }
              `}
            >
              {getIcon(item.icon, `mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`)}
              <span className="flex-1 text-left flex items-center justify-between">
                {item.label}
                {isLocked && <Lock className="h-3 w-3 text-slate-600 group-hover:text-slate-500" />}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-8 bg-orange-400 rounded-r-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex-shrink-0">
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
            GM
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">George's Music</p>
            <p className="text-xs text-slate-500">Premium Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};