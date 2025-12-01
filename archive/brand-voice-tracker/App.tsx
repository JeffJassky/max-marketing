import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import BrandVoiceTracker from './components/BrandVoiceTracker';
import DashboardHome from './components/DashboardHome';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardHome />} />
          {/* Main Brand Voice Route */}
          <Route path="brand-voice" element={<BrandVoiceTracker />} />
          {/* Brand Voice Sub-routes - currently pointing to main tracker but ensuring path exists */}
          <Route path="brand-voice/*" element={<BrandVoiceTracker />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;