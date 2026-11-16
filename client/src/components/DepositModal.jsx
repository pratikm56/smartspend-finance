import React, { useState } from 'react';
import { X, PlusCircle, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function DepositModal({ isOpen, onClose, goal, onSuccess }) {
  const { currency } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive contribution amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/goals/${goal.id}/deposit`, { amount: numAmount });
      if (res.data.reachedTarget) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      if (onSuccess) onSuccess(res.data.reachedTarget);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add contribution.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-100 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
          <PlusCircle className="text-emerald-400" size={22} />
          Contribute to Goal
        </h2>

        <p className="text-sm text-slate-400 mb-5">
          Adding funds to <strong className="text-white">"{goal.name}"</strong>
        </p>

        {/* Goal Progress Snapshot */}
        <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60 mb-5 text-xs text-slate-300 space-y-1.5">
          <div className="flex justify-between">
            <span>Target:</span>
            <span className="font-semibold text-white">{currency}{goal.target_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Current Saved:</span>
            <span className="font-semibold text-emerald-400">{currency}{goal.current_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-1.5">
            <span>Remaining:</span>
            <span className="font-semibold text-indigo-300">{currency}{Math.max(0, goal.target_amount - goal.current_amount).toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-rose-300 bg-rose-950/50 border border-rose-800 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Contribution Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">{currency}</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-lg font-semibold placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={18} />
              Confirm Contribution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
