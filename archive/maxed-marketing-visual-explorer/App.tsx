import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { Theme, View } from './types';

function App() {
  const [theme, setTheme] = useState<Theme>('focus');
  const [currentView, setCurrentView] = useState<View>('dashboard');

  return (
    <div className="flex h-screen w-full transition-theme overflow-hidden bg-amplify-dark">
      <Sidebar 
        theme={theme} 
        currentView={currentView} 
        setView={setCurrentView} 
      />
      {/* Dashboard component handles routing internally based on currentView */}
      <Dashboard 
        theme={theme} 
        currentView={currentView}
        setView={setCurrentView}
      />
      <ThemeSwitcher currentTheme={theme} setTheme={setTheme} />
    </div>
  );
}

export default App;