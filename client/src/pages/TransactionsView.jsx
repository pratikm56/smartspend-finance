import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  PlusCircle, Search, Filter, ArrowUpRight, ArrowDownRight, 
  Trash2, Edit, Calendar, Tag, CreditCard, ArrowUpDown, 
  Download, RefreshCw, AlertCircle
} from 'lucide-react';
import TransactionModal from '../components/TransactionModal';

const ALL_CATEGORIES = [
  'All Categories', 'Food', 'Rent', 'Transportation', 'Shopping', 'Utilities',
  'Entertainment', 'Healthcare', 'Subscriptions', 'Education', 'Travel', 
  'Salary', 'Freelancing', 'Business', 'Investments', 'Other'
];

const PAYMENT_METHODS = [
  'All Methods', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash', 'Bank Transfer', 'Other'
];

export default function TransactionsView() {
  const { currency } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [paymentFilter, setPaymentFilter] = useState('All Methods');
  const [datePreset, setDatePreset] = useState('this_month'); // 'this_month' | 'last_month' | 'all'
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const now = new Date();
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonth = lastMonthDate.toISOString().slice(0, 7);

      const params = {
        sortBy,
        sortOrder,
        limit: 200
      };

      if (typeFilter !== 'all') params.type = typeFilter;
      if (categoryFilter !== 'All Categories') params.category = categoryFilter;
      if (paymentFilter !== 'All Methods') params.paymentMethod = paymentFilter;
      if (search.trim()) params.search = search.trim();

      if (datePreset === 'this_month') {
        params.month = currentMonth;
      } else if (datePreset === 'last_month') {
        params.month = lastMonth;
      }

      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions || []);
      setSummary(res.data.summary || { totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0 });
      setTotalCount(res.data.total || 0);
      setError('');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, paymentFilter, datePreset, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      alert('Failed to delete transaction.');
    }
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Transactions Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage, categorize, filter, and audit all inflows and outflows.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle size={16} />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* FILTER SUMMARY KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Filtered Income</p>
          <p className="text-base sm:text-xl font-bold text-emerald-400 mt-0.5">
            +{currency}{summary.totalIncome.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Filtered Expenses</p>
          <p className="text-base sm:text-xl font-bold text-rose-400 mt-0.5">
            -{currency}{summary.totalExpense.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net Balance</p>
          <p className="text-base sm:text-xl font-bold text-indigo-300 mt-0.5">
            {currency}{summary.netSavings.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Records Count</p>
          <p className="text-base sm:text-xl font-bold text-white mt-0.5">
            {totalCount} Items
          </p>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, category, payment method..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </form>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shrink-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                typeFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                typeFilter === 'expense' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                typeFilter === 'income' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Secondary Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c} className="bg-slate-900">{c}</option>
            ))}
          </select>

          {/* Payment Method Dropdown */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {PAYMENT_METHODS.map(m => (
              <option key={m} value={m} className="bg-slate-900">{m}</option>
            ))}
          </select>

          {/* Date Preset Dropdown */}
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="this_month" className="bg-slate-900">This Month</option>
            <option value="last_month" className="bg-slate-900">Last Month</option>
            <option value="all" className="bg-slate-900">All Time History</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [col, ord] = e.target.value.split('_');
              setSortBy(col);
              setSortOrder(ord);
            }}
            className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="date_DESC" className="bg-slate-900">Date: Newest First</option>
            <option value="date_ASC" className="bg-slate-900">Date: Oldest First</option>
            <option value="amount_DESC" className="bg-slate-900">Amount: High to Low</option>
            <option value="amount_ASC" className="bg-slate-900">Amount: Low to High</option>
          </select>
        </div>
      </div>

      {/* TRANSACTIONS LIST / TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">
            Loading transaction ledger...
          </div>
        ) : transactions.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{tx.description}</div>
                        {tx.notes && <div className="text-[11px] text-slate-500 mt-0.5">{tx.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                        {tx.payment_method}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap text-sm">
                        <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}>
                          {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(tx)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-800">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{tx.description}</p>
                      <p className="text-[10px] text-slate-400">{tx.category} • {tx.date}</p>
                      <p className="text-[10px] text-slate-500">{tx.payment_method}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-xs font-bold font-mono ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <button
                        onClick={() => handleEdit(tx)}
                        className="p-1 text-slate-400 hover:text-indigo-400"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <p className="text-sm">No transactions match your current filters.</p>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              + Record First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Transaction Modal for Add/Edit */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={editingTx}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
