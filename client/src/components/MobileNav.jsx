import React from 'react';
import { 
  LayoutDashboard, Receipt, PieChart, Target, 
  TrendingUp, Lightbulb, LineChart, Sparkles, 
  FileSpreadsheet, UserCog, X
} from 'lucide-react';

const ALL_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'budgets', label: 'Budgets', icon: PieChart },
  { id: 'goals', label: 'Savings Goals', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'insights', label: 'AI Insights', icon: Lightbulb },
  { id: 'predictions', label: 'Predictions', icon: LineChart },
  { id: 'ai_chat', label: 'SmartSpend AI ✨', icon: Sparkles },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'profile', label: 'Settings', icon: UserCog }
];

export default function MobileNav({ activeTab, setActiveTab, isOpen, onClose }) {
  const handleSelect = (id) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
          <div 
            className="w-72 max-w-[80%] h-full bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white">
                    <Sparkles size={16} />
                  </div>
                  <span className="font-bold text-white text-base">SmartSpend AI</span>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-1">
                {ALL_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
              SmartSpend AI Fintech Suite v2.0
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Mobile Bar for Phones */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1 transition cursor-pointer ${
            activeTab === 'dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[10px]">Cockpit</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center gap-1 p-1 transition cursor-pointer ${
            activeTab === 'transactions' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Receipt size={18} />
          <span className="text-[10px]">Ledger</span>
        </button>

        {/* Center Floating AI Button */}
        <button
          onClick={() => setActiveTab('ai_chat')}
          className="relative -top-3 w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/40 border-2 border-slate-900 cursor-pointer"
        >
          <Sparkles size={20} />
        </button>

        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex flex-col items-center gap-1 p-1 transition cursor-pointer ${
            activeTab === 'budgets' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <PieChart size={18} />
          <span className="text-[10px]">Budgets</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 p-1 transition cursor-pointer ${
            activeTab === 'analytics' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <TrendingUp size={18} />
          <span className="text-[10px]">Analytics</span>
        </button>
      </nav>
    </>
  );
}
