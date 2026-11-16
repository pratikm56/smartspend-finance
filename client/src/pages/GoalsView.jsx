import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  PlusCircle, Target, Trophy, Calendar, Clock, 
  Trash2, Edit, CheckCircle2, Plus, Sparkles, TrendingUp
} from 'lucide-react';
import GoalModal from '../components/GoalModal';
import DepositModal from '../components/DepositModal';

export default function GoalsView() {
  const { currency } = useAuth();
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals');
      setGoals(res.data.goals || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this savings goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch (err) {
      alert('Failed to delete goal.');
    }
  };

  const handleOpenDeposit = (goal) => {
    setSelectedGoal(goal);
    setDepositModalOpen(true);
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setGoalModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingGoal(null);
    setGoalModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Savings & Financial Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Turn your financial dreams into structured, milestone-driven targets.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle size={16} />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* OVERALL GOALS SUMMARY COCKPIT */}
      {summary && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Aggregate Target Progress
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <h3 className="text-2xl font-black text-white">
                  {currency}{summary.totalSaved.toLocaleString()}
                </h3>
                <span className="text-xs text-slate-400">
                  of {currency}{summary.totalTarget.toLocaleString()} total target
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-800">
                  {summary.overallProgress}% Complete
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400">Total Remaining Required</span>
              <p className="text-lg font-bold font-mono text-emerald-400">
                {currency}{summary.totalRemaining.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, parseFloat(summary.overallProgress))}%` }}
            />
          </div>
        </div>
      )}

      {/* GOALS CARDS GRID */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse">
          Loading financial goals...
        </div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const isCompleted = g.isCompleted;

            return (
              <div 
                key={g.id}
                className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg flex flex-col justify-between hover:border-slate-700 transition relative overflow-hidden"
              >
                {/* Accent top colored strip */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: g.color || '#6366F1' }}
                />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-3 pt-1">
                    <div>
                      <h3 className="font-bold text-base text-white">{g.name}</h3>
                      <span className="text-[11px] text-slate-400">{g.category}</span>
                    </div>
                    {isCompleted ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <Trophy size={12} className="text-emerald-400" />
                        Target Reached!
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-indigo-300">
                        {g.progressPercentage}%
                      </span>
                    )}
                  </div>

                  {/* Financial Metrics */}
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1.5 mb-4 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Saved so far:</span>
                      <strong className="text-emerald-400 font-mono text-sm">{currency}{g.current_amount.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Target:</span>
                      <strong className="text-white font-mono">{currency}{g.target_amount.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-1">
                      <span>Remaining:</span>
                      <strong className="text-indigo-300 font-mono">{currency}{g.remaining.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, parseFloat(g.progressPercentage))}%`,
                          backgroundColor: g.color || '#6366F1'
                        }}
                      />
                    </div>
                  </div>

                  {/* Target Date & Required Pace */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-slate-500" />
                      <span>{g.target_date} ({g.daysRemaining}d left)</span>
                    </div>
                    {!isCompleted && g.monthlyPaceNeeded > 0 && (
                      <div className="text-right">
                        <span className="text-indigo-400 font-semibold font-mono">
                          ~{currency}{g.monthlyPaceNeeded.toLocaleString()}/mo
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenDeposit(g)}
                    disabled={isCompleted}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                  >
                    <Plus size={14} />
                    <span>Contribute</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(g)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
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
          <p className="text-sm text-slate-400">No savings goals created yet.</p>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            + Create First Goal
          </button>
        </div>
      )}

      {/* Modals */}
      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        existingGoal={editingGoal}
        onSuccess={fetchGoals}
      />

      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        goal={selectedGoal}
        onSuccess={fetchGoals}
      />
    </div>
  );
}
