import React, { useState, useEffect } from 'react';
import { X, Target, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const GOAL_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#3B82F6'  // Blue
];

export default function GoalModal({ isOpen, onClose, existingGoal = null, onSuccess }) {
  const { currency } = useAuth();
  const isEditing = Boolean(existingGoal);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Savings');
  const [color, setColor] = useState('#6366F1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingGoal) {
      setName(existingGoal.name || '');
      setTargetAmount(existingGoal.target_amount ? existingGoal.target_amount.toString() : '');
      setCurrentAmount(existingGoal.current_amount !== undefined ? existingGoal.current_amount.toString() : '0');
      setTargetDate(existingGoal.target_date || '');
      setCategory(existingGoal.category || 'Savings');
      setColor(existingGoal.color || '#6366F1');
      setNotes(existingGoal.notes || '');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      // Default to 6 months in future
      const future = new Date();
      future.setMonth(future.getMonth() + 6);
      setTargetDate(future.toISOString().slice(0, 10));
      setCategory('Savings');
      setColor('#6366F1');
      setNotes('');
    }
    setError('');
  }, [existingGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a goal title.');
      return;
    }
    const numTarget = parseFloat(targetAmount);
    if (isNaN(numTarget) || numTarget <= 0) {
      setError('Target amount must be a positive number.');
      return;
    }
    const numCurrent = parseFloat(currentAmount) || 0;
    if (numCurrent < 0) {
      setError('Current saved amount cannot be negative.');
      return;
    }
    if (!targetDate) {
      setError('Target date is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        target_amount: numTarget,
        current_amount: numCurrent,
        target_date: targetDate,
        category: category.trim(),
        color,
        notes: notes.trim()
      };

      if (isEditing) {
        await api.put(`/goals/${existingGoal.id}`, payload);
      } else {
        await api.post('/goals', payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save financial goal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-100 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold tracking-tight text-white mb-5 flex items-center gap-2">
          <Target className="text-indigo-400" size={22} />
          {isEditing ? 'Edit Financial Goal' : 'Create New Financial Goal'}
        </h2>

        {error && (
          <div className="mb-4 p-3 text-sm text-rose-300 bg-rose-950/50 border border-rose-800 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Goal Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New M3 MacBook Pro, Emergency Fund, Bali Vacation"
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Target Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{currency}</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="100000"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm font-semibold placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Current Saved</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{currency}</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm font-semibold placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Target Completion Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Category / Purpose</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Tech, Travel, Emergency"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Color Tag Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Accent Theme</label>
            <div className="flex items-center gap-3">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why this goal matters, strategy, etc."
              className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={18} />
              {isEditing ? 'Save Changes' : 'Create Financial Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
