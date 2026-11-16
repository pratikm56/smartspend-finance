import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  FileSpreadsheet, Download, Printer, Filter, Calendar, 
  ArrowUpRight, ArrowDownRight, Tag, ShieldCheck
} from 'lucide-react';

const CATEGORIES = [
  'all', 'Food', 'Rent', 'Transportation', 'Shopping', 'Utilities',
  'Entertainment', 'Healthcare', 'Subscriptions', 'Education', 'Salary', 'Freelancing', 'Other'
];

export default function ReportsView() {
  const { user, currency } = useAuth();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { month };
      if (category !== 'all') params.category = category;
      const res = await api.get('/reports/summary', { params });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month, category]);

  const handleExportCSV = () => {
    const token = localStorage.getItem('smartspend_token');
    const url = `/reports/export/csv?month=${month}${category !== 'all' ? `&category=${category}` : ''}`;
    
    // Download via tokenized request
    api.get(url, { responseType: 'blob' })
      .then((response) => {
        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `smartspend-report-${month}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => alert('Failed to export CSV.'));
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = data?.summary || { totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0, transactionCount: 0 };
  const categories = data?.categoryBreakdown || [];
  const budgets = data?.budgets || [];
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-6 print:p-0 print:bg-white print:text-black">
      {/* Top Header & Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Financial Statements & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Audit-grade summaries, category ledger statements, and CSV exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
          >
            <Printer size={15} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-3 print:hidden text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold uppercase">Report Period:</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold uppercase">Category Filter:</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c} className="bg-slate-900">{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Printable Financial Statement Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Letterhead */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white print:text-black">
              SmartSpend Financial Statement
            </h2>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Account Holder: <strong className="text-white print:text-black">{user?.name}</strong> ({user?.email})
            </p>
            <p className="text-xs text-slate-400 print:text-gray-600">
              Reporting Month: <strong className="text-indigo-400 print:text-black font-mono">{month}</strong>
            </p>
          </div>
          <div className="text-right text-xs text-slate-400 print:text-gray-600">
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <p className="text-[10px] text-emerald-400 print:text-green-700 font-semibold">Verified Ledger</p>
          </div>
        </div>

        {/* Financial Summary KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-800/50 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-200">
            <span className="text-[11px] font-semibold text-slate-400 print:text-gray-600 uppercase">Gross Income</span>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 print:text-green-700 mt-1 font-mono">
              +{currency}{summary.totalIncome.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-200">
            <span className="text-[11px] font-semibold text-slate-400 print:text-gray-600 uppercase">Total Expenses</span>
            <p className="text-lg sm:text-xl font-bold text-rose-400 print:text-red-700 mt-1 font-mono">
              -{currency}{summary.totalExpense.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-200">
            <span className="text-[11px] font-semibold text-slate-400 print:text-gray-600 uppercase">Net Savings</span>
            <p className="text-lg sm:text-xl font-bold text-indigo-300 print:text-blue-700 mt-1 font-mono">
              {currency}{summary.netSavings.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-200">
            <span className="text-[11px] font-semibold text-slate-400 print:text-gray-600 uppercase">Savings Rate</span>
            <p className="text-lg sm:text-xl font-bold text-white print:text-black mt-1 font-mono">
              {summary.savingsRate}%
            </p>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div>
          <h3 className="font-bold text-base text-white print:text-black mb-3">
            Category Spending Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 print:text-black">
              <thead className="bg-slate-800/60 print:bg-gray-200 text-slate-400 print:text-gray-700 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Flow Type</th>
                  <th className="py-2.5 px-3 text-right">Transactions</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                {categories.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-white print:text-black">{c.category}</td>
                    <td className="py-2.5 px-3 capitalize">{c.type}</td>
                    <td className="py-2.5 px-3 text-right">{c.count}</td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      c.type === 'income' ? 'text-emerald-400 print:text-green-700' : 'text-slate-200 print:text-black'
                    }`}>
                      {currency}{c.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget vs Actual Variance Table (if budgets exist) */}
        {budgets.length > 0 && (
          <div>
            <h3 className="font-bold text-base text-white print:text-black mb-3">
              Budget vs Actual Variance Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 print:text-black">
                <thead className="bg-slate-800/60 print:bg-gray-200 text-slate-400 print:text-gray-700 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Budget Limit</th>
                    <th className="py-2.5 px-3 text-right">Actual Spent</th>
                    <th className="py-2.5 px-3 text-right">Variance / Balance</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                  {budgets.map((b, i) => {
                    const variance = b.budgeted - b.actualSpent;
                    return (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-semibold text-white print:text-black">{b.category}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{currency}{b.budgeted.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{currency}{b.actualSpent.toLocaleString()}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${variance >= 0 ? 'text-emerald-400 print:text-green-700' : 'text-rose-400 print:text-red-700'}`}>
                          {variance >= 0 ? `+${currency}${variance.toLocaleString()}` : `-${currency}${Math.abs(variance).toLocaleString()}`}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            variance < 0 ? 'bg-rose-950 text-rose-300 print:text-red-700' : 'bg-emerald-950 text-emerald-300 print:text-green-700'
                          }`}>
                            {variance < 0 ? 'Exceeded' : 'Under Budget'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Itemized Transactions Ledger */}
        <div>
          <h3 className="font-bold text-base text-white print:text-black mb-3">
            Itemized Transactions Ledger ({transactions.length} records)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 print:text-black">
              <thead className="bg-slate-800/60 print:bg-gray-200 text-slate-400 print:text-gray-700 uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Method</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 px-3 font-mono text-slate-400 print:text-gray-600">{t.date}</td>
                    <td className="py-2 px-3 text-white print:text-black">{t.description}</td>
                    <td className="py-2 px-3">{t.category}</td>
                    <td className="py-2 px-3 text-slate-400 print:text-gray-600">{t.payment_method}</td>
                    <td className={`py-2 px-3 text-right font-mono font-bold ${
                      t.type === 'income' ? 'text-emerald-400 print:text-green-700' : 'text-slate-200 print:text-black'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
