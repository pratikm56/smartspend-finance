import React from 'react';
import { 
  LayoutDashboard, Receipt, PieChart, Target, 
  TrendingUp, Lightbulb, LineChart, Sparkles, 
  FileSpreadsheet, UserCog
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'budgets', label: 'Budgets', icon: PieChart },
  { id: 'goals', label: 'Savings Goals', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'insights', label: 'AI Insights', icon: Lightbulb, badge: 'Smart' },
  { id: 'predictions', label: 'Predictions', icon: LineChart, badge: 'ML' },
  { id: 'ai_chat', label: 'SmartSpend AI', icon: Sparkles, highlight: true },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'profile', label: 'Settings', icon: UserCog }
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-slate-900/95 border-r border-slate-800 p-4 h-[calc(100vh-57px)] sticky top-[57px] select-none">
      <div className="space-y-1.5 flex-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Financial Management
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer my-2 border ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-400/50 shadow-lg shadow-violet-600/25 font-semibold'
                    : 'bg-violet-950/30 hover:bg-violet-950/60 text-violet-300 border-violet-800/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-white' : 'text-violet-400'} />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-400/20 text-violet-300 font-bold border border-violet-400/30">
                  AI ✨
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Security notice at bottom */}
      <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl text-[11px] text-slate-400">
        <p className="font-semibold text-slate-300">Strict User Isolation</p>
        <p className="mt-0.5 text-slate-500">Your financial records are encrypted & private to your account.</p>
      </div>
    </aside>
  );
}
