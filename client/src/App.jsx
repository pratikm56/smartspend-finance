import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import DashboardView from './pages/DashboardView';
import TransactionsView from './pages/TransactionsView';
import BudgetsView from './pages/BudgetsView';
import GoalsView from './pages/GoalsView';
import AnalyticsView from './pages/AnalyticsView';
import InsightsView from './pages/InsightsView';
import PredictionsView from './pages/PredictionsView';
import AIChatView from './pages/AIChatView';
import ReportsView from './pages/ReportsView';
import ProfileView from './pages/ProfileView';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import AuthModal from './components/AuthModal';
import TransactionModal from './components/TransactionModal';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  const triggerDataRefresh = () => {
    setDataRefreshKey(k => k + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-500">Initializing SmartSpend...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render high-converting SaaS Landing Page
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  // Authenticated FinTech Cockpit
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16 md:pb-0">
      {/* Top App Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTransactionModal={() => setTxModalOpen(true)}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
        onDataRefresh={triggerDataRefresh}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Main View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              key={dataRefreshKey}
              onOpenTransactionModal={() => setTxModalOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'transactions' && <TransactionsView key={dataRefreshKey} />}
          {activeTab === 'budgets' && <BudgetsView key={dataRefreshKey} />}
          {activeTab === 'goals' && <GoalsView key={dataRefreshKey} />}
          {activeTab === 'analytics' && <AnalyticsView key={dataRefreshKey} />}
          {activeTab === 'insights' && <InsightsView key={dataRefreshKey} setActiveTab={setActiveTab} />}
          {activeTab === 'predictions' && <PredictionsView key={dataRefreshKey} />}
          {activeTab === 'ai_chat' && <AIChatView key={dataRefreshKey} />}
          {activeTab === 'reports' && <ReportsView key={dataRefreshKey} />}
          {activeTab === 'profile' && <ProfileView onDataRefresh={triggerDataRefresh} />}
        </main>
      </div>

      {/* Mobile Drawer & Bottom Thumb Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Global Transaction Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSuccess={triggerDataRefresh}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
