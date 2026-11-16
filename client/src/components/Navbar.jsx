import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, PlusCircle, Database, User, LogOut, Settings, 
  Menu, X, Check, ShieldCheck
} from 'lucide-react';
import api from '../api';

export default function Navbar({ activeTab, setActiveTab, onOpenTransactionModal, onMobileMenuToggle, isMobileMenuOpen, onDataRefresh }) {
  const { user, currency, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleSeedData = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      await api.post('/seed/demo-data');
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 2500);
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      console.error('Failed to seed demo data:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">SmartSpend</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Intelligent Personal Finance</p>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Data Seed Button */}
          <button
            onClick={handleSeedData}
            disabled={seeding}
            title="Load realistic sample transactions, budgets & goals"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
              seedSuccess 
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300' 
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {seedSuccess ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="hidden sm:inline">Data Loaded!</span>
              </>
            ) : (
              <>
                <Database size={14} className="text-indigo-400" />
                <span className="hidden sm:inline">{seeding ? 'Loading...' : 'Load Sample Data'}</span>
              </>
            )}
          </button>

          {/* Quick Record Transaction Button */}
          <button
            onClick={onOpenTransactionModal}
            className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition cursor-pointer"
          >
            <PlusCircle size={16} />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-300">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium hidden md:block max-w-[100px] truncate">{user?.name}</span>
            </button>

            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-fade-in"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                    <ShieldCheck size={12} />
                    <span>Verified Account ({currency})</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition"
                  >
                    <Settings size={14} />
                    Account Settings
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 transition"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
