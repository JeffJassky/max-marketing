import React from 'react';
import { Theme } from '../types';
import { Layout, Zap } from 'lucide-react';

interface ThemeSwitcherProps {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, setTheme }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex bg-amplify-dark/90 backdrop-blur-md p-1.5 rounded-full border border-slate-700 shadow-2xl">
      <button
        onClick={() => setTheme('focus')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
          currentTheme === 'focus'
            ? 'bg-amplify-green text-amplify-darker shadow-lg'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Layout size={16} />
        Focus Mode
      </button>
      <button
        onClick={() => setTheme('executive')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
          currentTheme === 'executive'
            ? 'bg-amplify-secondary text-white shadow-lg'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Zap size={16} />
        Executive Mode
      </button>
    </div>
  );
};