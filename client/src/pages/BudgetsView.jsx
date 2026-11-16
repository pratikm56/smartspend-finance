import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  PlusCircle, PieChart, AlertTriangle, AlertCircle, 
  CheckCircle2, Trash2, Edit, Calendar, ArrowRight, ShieldAlert
} from 'lucide-react';
import BudgetModal from '../components/BudgetModal';

export default function BudgetsView() {
  const { currency } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets', { params: { month: currentMonth } });
      setBudgets(res.data.budgets || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [currentMonth]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget cap?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      alert('Failed to delete budget.');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingBudget(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Budget Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Set category spending thresholds and prevent budget exhaustion.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          />
          <button
            onClick={handleAddNew}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* OVERALL BUDGET SUMMARY COCKPIT */}
      {summary && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Monthly Target vs Actual Spend ({currentMonth})
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <h3 className="text-2xl font-black text-white">
                  {currency}{summary.totalSpentInBudgets.toLocaleString()}
                </h3>
                <span className="text-xs text-slate-400">
                  of {currency}{summary.totalBudgeted.toLocaleString()} budgeted
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  parseFloat(summary.overallUsedPercentage) > 100 
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                    : (parseFloat(summary.overallUsedPercentage) >= 85
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                      : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800')
                }`}>
                  {summary.overallUsedPercentage}% Used
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400">Total Remaining In Cap</span>
              <p className={`text-lg font-bold font-mono ${
                summary.remainingOverall >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {summary.remainingOverall >= 0 
                  ? `${currency}${summary.remainingOverall.toLocaleString()}` 
                  : `Exceeded by ${currency}${Math.abs(summary.remainingOverall).toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${
                parseFloat(summary.overallUsedPercentage) > 100 
                  ? 'bg-rose-500' 
                  : (parseFloat(summary.overallUsedPercentage) >= 85 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-500')
              }`}
              style={{ width: `${Math.min(100, parseFloat(summary.overallUsedPercentage))}%` }}
            />
          </div>
        </div>
      )}

      {/* CATEGORY BUDGET CARDS GRID */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse">
          Loading category budgets...
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const usedPct = parseFloat(b.usedPercentage);
            let badgeBg = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
            let barColor = 'bg-emerald-500';
            let statusText = 'On Track';

            if (b.status === 'exceeded') {
              badgeBg = 'bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse';
              barColor = 'bg-rose-500';
              statusText = 'Budget Exceeded!';
            } else if (b.status === 'danger') {
              badgeBg = 'bg-rose-950/60 text-rose-300 border-rose-800/60';
              barColor = 'bg-rose-400';
              statusText = 'Nearly Exhausted (>90%)';
            } else if (b.status === 'warning') {
              badgeBg = 'bg-amber-950/60 text-amber-300 border-amber-800/60';
              barColor = 'bg-amber-400';
              statusText = 'High Usage (>75%)';
            }

            return (
              <div 
                key={b.id} 
                className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-base text-white">{b.category}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${badgeBg}`}>
                      {statusText}
                    </span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Spent:</span>
                      <span className="font-semibold text-white">{currency}{b.spent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Budget:</span>
                      <span className="font-semibold text-slate-300">{currency}{b.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800 pt-1">
                      <span>Remaining:</span>
                      <span className={`font-mono font-bold ${b.remaining >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                        {b.remaining >= 0 ? `${currency}${b.remaining.toLocaleString()}` : `-${currency}${Math.abs(b.remaining).toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                      <span>Utilization</span>
                      <span className={usedPct > 100 ? 'text-rose-400' : 'text-slate-300'}>{b.usedPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, usedPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">{b.month}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEdit(b)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
          <p className="text-sm text-slate-400">No category budgets created for {currentMonth}.</p>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            + Create First Budget Cap
          </button>
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentMonth={currentMonth}
        existingBudget={editingBudget}
        onSuccess={fetchBudgets}
      />
    </div>
  );
}
