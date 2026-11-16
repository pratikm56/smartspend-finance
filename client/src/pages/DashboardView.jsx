import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, 
  Sparkles, Target, PieChart, ShieldCheck, AlertTriangle, 
  ChevronRight, Calendar, PlusCircle, Database, HelpCircle
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
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardView({ onOpenTransactionModal, setActiveTab }) {
  const { user, currency } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, insRes, predRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/insights'),
        api.get('/predictions')
      ]);
      setData(dashRes.data);
      setInsights(insRes.data.insights || []);
      setPredictions(predRes.data);
      setError('');
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-800/40 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-800/40 rounded-2xl lg:col-span-2" />
          <div className="h-80 bg-slate-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || { income: 0, expenses: 0, savings: 0, savingsRate: 0 };
  const health = data?.health || { score: 75, grade: 'Good', color: '#10B981' };
  const recent = data?.recentTransactions || [];
  const categories = data?.categorySpending || [];
  const budgetsSummary = data?.budgetsSummary || { totalBudgets: 0, safe: 0, warning: 0, exceeded: 0 };
  const goalsPreview = data?.goalsPreview || [];

  const isEmpty = summary.income === 0 && summary.expenses === 0 && recent.length === 0;

  // Chart: Income vs Expense Bar Data
  const incomeVsExpenseChartData = {
    labels: ['Monthly Flow'],
    datasets: [
      {
        label: 'Income',
        data: [summary.income],
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: '#10B981',
        borderWidth: 1,
        borderRadius: 8
      },
      {
        label: 'Expenses',
        data: [summary.expenses],
        backgroundColor: 'rgba(244, 63, 94, 0.85)',
        borderColor: '#F43F5E',
        borderWidth: 1,
        borderRadius: 8
      },
      {
        label: 'Net Savings',
        data: [summary.savings],
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderColor: '#6366F1',
        borderWidth: 1,
        borderRadius: 8
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94A3B8', font: { size: 11, family: 'system-ui' } }
      },
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
          callback: (value) => `${currency}${value.toLocaleString()}`
        }
      }
    }
  };

  // Chart: Category Spending Doughnut
  const doughnutColors = [
    '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', 
    '#06B6D4', '#F43F5E', '#3B82F6', '#14B8A6', '#84CC16'
  ];

  const doughnutData = {
    labels: categories.map(c => c.category),
    datasets: [
      {
        data: categories.map(c => c.amount),
        backgroundColor: doughnutColors.slice(0, categories.length),
        borderColor: '#0F172A',
        borderWidth: 2
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94A3B8', boxWidth: 12, font: { size: 10 } }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${currency}${ctx.parsed.toLocaleString()}`
        }
      }
    },
    cutout: '68%'
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Welcome back, {user?.name || 'User'}</span>
            <span className="text-sm font-normal text-slate-400">({data?.currentMonth})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Here is your live personal financial overview and predictive trajectory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTransactionModal}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Empty State Banner if 0 records */}
      {isEmpty && (
        <div className="p-6 bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Your Financial Cockpit is Ready</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Start tracking your spending to unlock personalized AI insights, budget tracking, and predictive forecasting.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenTransactionModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              + Add First Expense
            </button>
          </div>
        </div>
      )}

      {/* 4 CORE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Income</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            {currency}{summary.income.toLocaleString()}
          </h2>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            {summary.incomeMoM !== null ? (
              <span className={`font-semibold mr-1.5 flex items-center ${summary.incomeMoM >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summary.incomeMoM >= 0 ? `+${summary.incomeMoM}%` : `${summary.incomeMoM}%`}
              </span>
            ) : null}
            <span>{summary.incomeMoM !== null ? 'vs last month' : 'Current month inflow'}</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            {currency}{summary.expenses.toLocaleString()}
          </h2>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            {summary.expenseMoM !== null ? (
              <span className={`font-semibold mr-1.5 flex items-center ${summary.expenseMoM <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summary.expenseMoM > 0 ? `+${summary.expenseMoM}%` : `${summary.expenseMoM}%`}
              </span>
            ) : null}
            <span>{summary.expenseMoM !== null ? 'vs last month' : 'Current month outflow'}</span>
          </div>
        </div>

        {/* Total Savings Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Savings</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            {currency}{summary.savings.toLocaleString()}
          </h2>
          <div className="mt-2 text-xs text-slate-400">
            Inflow minus outflow
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden group hover:border-violet-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Savings Rate</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center font-bold text-xs">
              %
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {summary.savingsRate}%
            </h2>
            <span className="text-xs text-slate-400 font-medium">/ 20% target</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1.5 rounded-full" 
                style={{ width: `${Math.min(100, (summary.savingsRate / 20) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FINANCIAL HEALTH SCORE & PREDICTOR BANNER ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Health Score Cockpit Card */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={18} />
                <h3 className="text-base font-bold text-white">Financial Health</h3>
              </div>
              <span 
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${health.color}20`, color: health.color, border: `1px solid ${health.color}50` }}
              >
                {health.grade}
              </span>
            </div>

            <div className="flex items-center gap-4 my-2">
              <div className="relative w-20 h-20 rounded-full border-4 flex items-center justify-center shrink-0" style={{ borderColor: health.color }}>
                <span className="text-2xl font-black text-white">{health.score}</span>
                <span className="text-[10px] text-slate-400 absolute bottom-2">/100</span>
              </div>
              <div className="space-y-1.5 flex-1 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Savings Discipline</span>
                    <span>{health.components?.savingsScore}/30</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1">
                    <div className="bg-emerald-400 h-1 rounded-full" style={{ width: `${(health.components?.savingsScore / 30) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Budget Adherence</span>
                    <span>{health.components?.budgetScore}/30</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1">
                    <div className="bg-indigo-400 h-1 rounded-full" style={{ width: `${(health.components?.budgetScore / 30) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Outflow Diversification</span>
                    <span>{health.components?.concentrationScore}/20</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1">
                    <div className="bg-violet-400 h-1 rounded-full" style={{ width: `${(health.components?.concentrationScore / 20) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Composite score dynamically weighted from savings rate, budget variance, and spending risk.
          </div>
        </div>

        {/* Next Month Predicted Expense Teaser Card */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-violet-400" size={18} />
                <h3 className="text-base font-bold text-white">Future Outflow Forecast</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  ML Prediction
                </span>
              </div>
              <button 
                onClick={() => setActiveTab('predictions')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>View Breakdown</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {predictions && predictions.hasEnoughData ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800">
                  <p className="text-[11px] text-slate-400">Estimated Next Month Outflow</p>
                  <p className="text-xl font-extrabold text-amber-300 mt-1">
                    {currency}{predictions.overallPrediction.estimated.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Expected range: {currency}{predictions.overallPrediction.lowerBound.toLocaleString()} – {currency}{predictions.overallPrediction.upperBound.toLocaleString()}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800">
                  <p className="text-[11px] text-slate-400">Trajectory vs Current Month</p>
                  <p className={`text-base font-bold mt-1 flex items-center gap-1 ${predictions.overallPrediction.trend === 'upward' ? 'text-rose-400' : (predictions.overallPrediction.trend === 'downward' ? 'text-emerald-400' : 'text-slate-300')}`}>
                    {predictions.overallPrediction.trend === 'upward' ? '↗ Expected Surge' : (predictions.overallPrediction.trend === 'downward' ? '↘ Expected Reduction' : '→ Stable')}
                    <span>({predictions.overallPrediction.trendPct >= 0 ? `+${predictions.overallPrediction.trendPct}%` : `${predictions.overallPrediction.trendPct}%`})</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Based on multi-month slope</p>
                </div>

                <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800">
                  <p className="text-[11px] text-slate-400">Top Predicted Driver</p>
                  <p className="text-base font-bold text-white mt-1 truncate">
                    {predictions.categoryPredictions[0]?.category || 'Rent/Food'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    ~{currency}{predictions.categoryPredictions[0]?.predictedAmount.toLocaleString() || '0'} projected
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400">
                Record 2 or more months of expense history to train regression forecasts.
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mt-3">
            * Statistical projection calculated via weighted linear regression of historical patterns.
          </p>
        </div>
      </div>

      {/* CHARTS SECTION: Income vs Expense & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Monthly Cash Flow Comparison</h3>
            <span className="text-xs text-slate-400">Inflow vs Outflow vs Savings</span>
          </div>
          <div className="h-64 sm:h-72">
            <Bar data={incomeVsExpenseChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Category Breakdown Doughnut */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Category Distribution</h3>
              <span className="text-xs text-slate-400">{categories.length} Categories</span>
            </div>
            <div className="h-56 relative flex items-center justify-center">
              {categories.length > 0 ? (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              ) : (
                <div className="text-xs text-slate-500 text-center">
                  No category expenses recorded yet.
                </div>
              )}
            </div>
          </div>
          <div className="text-center text-[11px] text-slate-400 mt-2">
            {categories.length > 0 ? (
              <span>Top: <strong className="text-white">{categories[0].category}</strong> ({currency}{categories[0].amount.toLocaleString()})</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* AI INSIGHTS & BUDGET STATUS & RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Generated Insights Highlight */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-violet-400" />
              <h3 className="text-base font-bold text-white">AI Financial Insights</h3>
            </div>
            <button 
              onClick={() => setActiveTab('insights')}
              className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
            >
              All Insights
            </button>
          </div>

          <div className="space-y-3">
            {insights.slice(0, 3).map((ins, i) => (
              <div 
                key={ins.id || i}
                className={`p-3.5 rounded-xl border text-xs leading-relaxed transition ${
                  ins.severity === 'urgent' 
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    : (ins.severity === 'warning'
                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                      : (ins.severity === 'success'
                        ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300'))
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">{ins.title}</span>
                  {ins.metric && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-900/60 border border-slate-700">
                      {ins.metric}
                    </span>
                  )}
                </div>
                <p className="text-slate-300">{ins.description}</p>
              </div>
            ))}

            {insights.length === 0 && (
              <div className="text-xs text-slate-500 py-6 text-center">
                Insights will appear dynamically as you add transactions.
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Active Budgets Preview */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart size={18} className="text-indigo-400" />
              <h3 className="text-base font-bold text-white">Budgets Status</h3>
            </div>
            <button 
              onClick={() => setActiveTab('budgets')}
              className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
            >
              Manage
            </button>
          </div>

          <div className="space-y-4">
            {budgetsSummary.totalBudgets > 0 ? (
              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Categories Tracked:</span>
                  <strong className="text-white">{budgetsSummary.totalBudgets}</strong>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Within Limit (&lt;85%):</span>
                  <strong>{budgetsSummary.safe}</strong>
                </div>
                {budgetsSummary.warning > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>High Usage Warning (&gt;85%):</span>
                    <strong>{budgetsSummary.warning}</strong>
                  </div>
                )}
                {budgetsSummary.exceeded > 0 && (
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>Budgets Exceeded:</span>
                    <strong>{budgetsSummary.exceeded}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                <p>No budgets configured for this month.</p>
                <button
                  onClick={() => setActiveTab('budgets')}
                  className="mt-2 text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  + Set Category Budget
                </button>
              </div>
            )}

            {/* Savings Goals Preview */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Target size={14} className="text-indigo-400" />
                  Savings Goals
                </span>
                <button 
                  onClick={() => setActiveTab('goals')}
                  className="text-[11px] text-indigo-400 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {goalsPreview.slice(0, 2).map((g) => (
                  <div key={g.id} className="p-2.5 bg-slate-800/40 border border-slate-800 rounded-xl text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-white truncate max-w-[140px]">{g.name}</span>
                      <span className="text-indigo-300 font-mono font-bold">{g.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ width: `${g.progress}%`, backgroundColor: g.color || '#6366F1' }}
                      />
                    </div>
                  </div>
                ))}
                {goalsPreview.length === 0 && (
                  <p className="text-[11px] text-slate-500 text-center py-2">No active savings goals.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Transactions */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Recent Transactions</h3>
            <button 
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
            >
              All Records
            </button>
          </div>

          <div className="space-y-3">
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 rounded-xl transition">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}>
                    {tx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{tx.description}</p>
                    <p className="text-[10px] text-slate-400">{tx.category} • {tx.date}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-xs font-bold font-mono ${
                    tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toLocaleString()}
                  </p>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {tx.payment_method}
                  </span>
                </div>
              </div>
            ))}

            {recent.length === 0 && (
              <div className="text-xs text-slate-500 py-6 text-center">
                No transactions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
