import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CATEGORIES = [
  'Food', 'Rent', 'Transportation', 'Shopping', 'Utilities',
  'Entertainment', 'Healthcare', 'Subscriptions', 'Education', 'Travel', 'Other'
];

export default function BudgetModal({ isOpen, onClose, currentMonth, existingBudget = null, onSuccess }) {
  const { currency } = useAuth();
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(currentMonth || new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingBudget) {
      setCategory(existingBudget.category);
      setAmount(existingBudget.amount ? existingBudget.amount.toString() : '');
      setMonth(existingBudget.month || currentMonth);
    } else {
      setCategory('Food');
      setAmount('');
      setMonth(currentMonth || new Date().toISOString().slice(0, 7));
    }
    setError('');
  }, [existingBudget, isOpen, currentMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive budget limit.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/budgets', {
        category,
        month,
        amount: numAmount
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save budget.');
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

        <h2 className="text-xl font-bold tracking-tight text-white mb-5">
          {existingBudget ? 'Update Budget Limit' : 'Set Category Budget'}
        </h2>

        {error && (
          <div className="mb-4 p-3 text-sm text-rose-300 bg-rose-950/50 border border-rose-800 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={Boolean(existingBudget)}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-60"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Target Month</label>
            <input
              type="month"
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Monthly Spending Cap</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">{currency}</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-lg font-semibold placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">SmartSpend will notify you when spending approaches 80% or exceeds this cap.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={18} />
              {existingBudget ? 'Save Changes' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
