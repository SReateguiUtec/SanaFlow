import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Component as ExperienceHero } from './components/experience-hero';
import ProblemContextSection from './components/ProblemContextSection';
import ArchitectureSection from './components/ArchitectureSection';
import ResilienceSection from './components/ResilienceSection';
import TriageDashboard from './components/TriageDashboard';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Dashboard Imports
import DashboardLayout from './pages/DashboardLayout';
import OverviewView from './components/dashboard/OverviewView';
import UploadView from './components/dashboard/UploadView';
import HistoryView from './components/dashboard/HistoryView';
import AnalyticsView from './components/dashboard/AnalyticsView';

const LandingPage = () => (
  <div className="bg-[#060503] min-h-screen text-white">
    <ExperienceHero />
    <ProblemContextSection />
    <ArchitectureSection />
    <ResilienceSection />
    <TriageDashboard />
    <Footer />
  </div>
);

import React from 'react';
import { getToken } from './lib/api';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<OverviewView />} />
          <Route path="upload" element={<UploadView />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="analytics" element={<AnalyticsView />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
