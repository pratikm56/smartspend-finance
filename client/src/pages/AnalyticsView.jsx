import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  TrendingUp, TrendingDown, PieChart as PieIcon, CreditCard, 
  ShieldCheck, ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

export default function AnalyticsView() {
  const { currency } = useAuth();
  const [trends, setTrends] = useState([]);
  const [categoriesData, setCategoriesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(6); // 6 or 12 months

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [trendsRes, catRes] = await Promise.all([
        api.get('/analytics/trends', { params: { months: timeframe } }),
        api.get('/analytics/categories')
      ]);
      setTrends(trendsRes.data.trends || []);
      setCategoriesData(catRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  // Chart 1: Multi-Month Cash Flow Bar Chart
  const flowBarData = {
    labels: trends.map(t => t.month),
    datasets: [
      {
        label: 'Income',
        data: trends.map(t => t.income),
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 6
      },
      {
        label: 'Expenses',
        data: trends.map(t => t.expenses),
        backgroundColor: 'rgba(244, 63, 94, 0.85)',
        borderRadius: 6
      }
    ]
  };

  const flowBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94A3B8', font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${currency}${ctx.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94A3B8' } },
      y: { 
        grid: { color: 'rgba(51, 65, 85, 0.4)' },
        ticks: { 
          color: '#94A3B8',
          callback: (v) => `${currency}${v.toLocaleString()}`
        }
      }
    }
  };

  // Chart 2: Net Savings & Savings Rate Line Chart
  const savingsLineData = {
    labels: trends.map(t => t.month),
    datasets: [
      {
        label: 'Net Savings',
        data: trends.map(t => t.savings),
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        fill: true,
        tension: 0.35,
        yAxisID: 'y'
      },
      {
        label: 'Savings Rate (%)',
        data: trends.map(t => t.savingsRate),
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        borderDash: [5, 5],
        tension: 0.2,
        yAxisID: 'y1'
      }
    ]
  };

  const savingsLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94A3B8', font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => ctx.datasetIndex === 0 
            ? `Net Savings: ${currency}${ctx.parsed.y.toLocaleString()}`
            : `Savings Rate: ${ctx.parsed.y}%`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94A3B8' } },
      y: {
        type: 'linear',
        position: 'left',
        grid: { color: 'rgba(51, 65, 85, 0.4)' },
        ticks: { color: '#94A3B8', callback: (v) => `${currency}${v.toLocaleString()}` }
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: { display: false },
        ticks: { color: '#10B981', callback: (v) => `${v}%` }
      }
    }
  };

  // Chart 3: Category Doughnut
  const categories = categoriesData?.categories || [];
  const doughnutColors = [
    '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', 
    '#06B6D4', '#F43F5E', '#3B82F6', '#14B8A6', '#84CC16'
  ];

  const catDoughnutData = {
    labels: categories.map(c => c.category),
    datasets: [
      {
        data: categories.map(c => c.totalAmount),
        backgroundColor: doughnutColors.slice(0, categories.length),
        borderColor: '#0F172A',
        borderWidth: 2
      }
    ]
  };

  const catDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94A3B8', boxWidth: 12, font: { size: 10 } } }
    },
    cutout: '65%'
  };

  const paymentMethods = categoriesData?.paymentMethods || [];
  const largestExpenses = categoriesData?.largestExpenses || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Spending Analytics & Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Deep-dive multi-month cash flow analysis, category distribution, and expense hierarchy.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto">
          <button
            onClick={() => setTimeframe(6)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              timeframe === 6 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            6 Months
          </button>
          <button
            onClick={() => setTimeframe(12)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              timeframe === 12 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            12 Months
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse">
          Generating deep-dive analytics...
        </div>
      ) : (
        <>
          {/* PRIMARY CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Cash Flow Inflow vs Outflow */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Monthly Inflow vs Outflow</h3>
                <span className="text-xs text-slate-400">Past {timeframe} Months</span>
              </div>
              <div className="h-64 sm:h-72">
                <Bar data={flowBarData} options={flowBarOptions} />
              </div>
            </div>

            {/* Chart 2: Net Savings & Savings Rate Line */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Savings Velocity & Savings Rate</h3>
                <span className="text-xs text-emerald-400 font-semibold">Dual-Axis Trend</span>
              </div>
              <div className="h-64 sm:h-72">
                <Line data={savingsLineData} options={savingsLineOptions} />
              </div>
            </div>
          </div>

          {/* SECONDARY ROW: Category Distribution & Top 5 Hierarchy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Doughnut */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Category Allocation</h3>
                  <span className="text-xs text-slate-400">Current Month</span>
                </div>
                <div className="h-56 relative flex items-center justify-center">
                  {categories.length > 0 ? (
                    <Doughnut data={catDoughnutData} options={catDoughnutOptions} />
                  ) : (
                    <p className="text-xs text-slate-500">No category transactions.</p>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-3">
                Total Month Outflow: <strong className="text-white">{currency}{(categoriesData?.totalExpense || 0).toLocaleString()}</strong>
              </p>
            </div>

            {/* Top 5 Spending Categories List */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Top Spending Categories</h3>
                <span className="text-xs text-slate-400">Ranked by Total Value</span>
              </div>

              <div className="space-y-3">
                {categories.slice(0, 5).map((cat, idx) => (
                  <div key={cat.category} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-white">{cat.category}</span>
                        <span className="text-[10px] text-slate-400">({cat.transactionCount} transactions)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-white mr-2">{currency}{cat.totalAmount.toLocaleString()}</span>
                        <span className="text-indigo-300 font-semibold">{cat.percentage}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}

                {categories.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-8">No expenses recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* TERTIARY ROW: Payment Methods & Largest Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Methods Breakdown */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Payment Method Share</h3>
                </div>
                <span className="text-xs text-slate-400">Outflow by Channel</span>
              </div>

              <div className="space-y-2.5">
                {paymentMethods.map((pm) => (
                  <div key={pm.method} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                        {pm.method}
                      </span>
                      <span className="text-slate-400">{pm.count} txns</span>
                    </div>
                    <span className="font-mono font-bold text-white">
                      {currency}{pm.totalAmount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {paymentMethods.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">No payment method data available.</p>
                )}
              </div>
            </div>

            {/* Largest Expenses Spotlight */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Highest Individual Expenses</h3>
                <span className="text-xs text-rose-400 font-semibold">Single Outflows</span>
              </div>

              <div className="space-y-2.5">
                {largestExpenses.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <p className="font-semibold text-white">{tx.description}</p>
                      <p className="text-[10px] text-slate-400">{tx.category} • {tx.date}</p>
                    </div>
                    <span className="font-mono font-bold text-rose-300 text-sm">
                      {currency}{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {largestExpenses.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">No expenses recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
