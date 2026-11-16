import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Calendar, Tag, CreditCard, FileText, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EXPENSE_CATEGORIES = [
  'Food', 'Rent', 'Transportation', 'Shopping', 'Utilities',
  'Entertainment', 'Healthcare', 'Subscriptions', 'Education', 'Travel', 'Other'
];

const INCOME_CATEGORIES = [
  'Salary', 'Freelancing', 'Business', 'Investments', 'Bonus', 'Rental', 'Other'
];

const PAYMENT_METHODS = [
  'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash', 'Bank Transfer', 'Other'
];

export default function TransactionModal({ isOpen, onClose, transaction = null, onSuccess }) {
  const { currency } = useAuth();
  const isEditing = Boolean(transaction);

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type || 'expense');
      setAmount(transaction.amount ? transaction.amount.toString() : '');
      setCategory(transaction.category || (transaction.type === 'income' ? 'Salary' : 'Food'));
      setDescription(transaction.description || '');
      setPaymentMethod(transaction.payment_method || 'UPI');
      setDate(transaction.date || new Date().toISOString().slice(0, 10));
      setNotes(transaction.notes || '');
    } else {
      setType('expense');
      setAmount('');
      setCategory('Food');
      setDescription('');
      setPaymentMethod('UPI');
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
    setError('');
  }, [transaction, isOpen]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'income') {
      if (!INCOME_CATEGORIES.includes(category)) setCategory('Salary');
    } else {
      if (!EXPENSE_CATEGORIES.includes(category)) setCategory('Food');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        type,
        amount: numAmount,
        category,
        description: description.trim(),
        payment_method: paymentMethod,
        date,
        notes: notes.trim()
      };

      if (isEditing) {
        await api.put(`/transactions/${transaction.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-100 overflow-hidden">
        {/* Glow ambient background */}
        <div className={`absolute -top-20 -left-20 w-40 h-40 ${type === 'income' ? 'bg-emerald-500/15' : 'bg-rose-500/15'} rounded-full blur-3xl pointer-events-none`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold tracking-tight text-white mb-5">
          {isEditing ? 'Edit Transaction' : 'Record New Transaction'}
        </h2>

        {error && (
          <div className="mb-4 p-3 text-sm text-rose-300 bg-rose-950/50 border border-rose-800 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle: Income vs Expense */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownRight size={16} />
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight size={16} />
              Income
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">{currency}</span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-lg font-semibold placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description & Category in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'expense' ? 'Grocery restock' : 'Client invoice'}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Date in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details or tag"
              className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-medium shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              <Check size={18} />
              {isEditing ? 'Update Transaction' : `Record ${type === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
