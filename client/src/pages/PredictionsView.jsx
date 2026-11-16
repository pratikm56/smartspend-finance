import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  LineChart as LineIcon, TrendingUp, TrendingDown, Minus, 
  HelpCircle, AlertCircle, Sparkles, ArrowRight, Info
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

export default function PredictionsView() {
  const { currency } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/predictions');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 animate-pulse">
        Training statistical time-series forecasting models...
      </div>
    );
  }

  const hasData = data?.hasEnoughData;
  const overall = data?.overallPrediction || { estimated: 0, lowerBound: 0, upperBound: 0, lastMonthActual: 0, trend: 'stable', trendPct: 0 };
  const categories = data?.categoryPredictions || [];

  // Chart comparing Last Month Actual vs Next Month Predicted
  const compareChartData = {
    labels: categories.slice(0, 6).map(c => c.category),
    datasets: [
      {
        label: `Last Month (${data?.currentMonth || 'Actual'})`,
        data: categories.slice(0, 6).map(c => c.lastMonthAmount),
        backgroundColor: 'rgba(148, 163, 184, 0.65)',
        borderRadius: 6
      },
      {
        label: `Predicted Next Month (${data?.nextMonth || 'Forecast'})`,
        data: categories.slice(0, 6).map(c => c.predictedAmount),
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        borderRadius: 6
      }
    ]
  };

  const compareOptions = {
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Future Expense Prediction
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Statistical ML
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Historical time-series regression and weighted moving averages to forecast your upcoming month.
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
          <p className="text-sm text-slate-400">
            {data?.message || 'Record 2 or more months of expense history to train predictive models.'}
          </p>
        </div>
      ) : (
        <>
          {/* OVERALL FORECAST KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Predicted Next Month Total ({data?.nextMonth})
              </span>
              <h2 className="text-3xl font-black text-amber-300 mt-2 font-mono">
                {currency}{overall.estimated.toLocaleString()}
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                Expected 90% confidence range: <br />
                <strong className="text-white font-mono">{currency}{overall.lowerBound.toLocaleString()} – {currency}{overall.upperBound.toLocaleString()}</strong>
              </p>
            </div>

            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Projected Trajectory
              </span>
              <div className="flex items-center gap-2 mt-2">
                {overall.trend === 'upward' && <TrendingUp className="text-rose-400" size={24} />}
                {overall.trend === 'downward' && <TrendingDown className="text-emerald-400" size={24} />}
                {overall.trend === 'stable' && <Minus className="text-slate-400" size={24} />}
                <h3 className={`text-xl font-bold ${
                  overall.trend === 'upward' ? 'text-rose-400' : (overall.trend === 'downward' ? 'text-emerald-400' : 'text-slate-200')
                }`}>
                  {overall.trend === 'upward' ? `+${overall.trendPct}% Increase Expected` : (overall.trend === 'downward' ? `${overall.trendPct}% Reduction Expected` : 'Stable Outflow Expected')}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Comparison against last month's actual total ({currency}{overall.lastMonthActual.toLocaleString()}).
              </p>
            </div>

            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Model Basis & Sample Size
              </span>
              <h3 className="text-xl font-bold text-white mt-2">
                {data?.monthsAnalyzed} Months of History
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Algorithm blends 70% linear trend slope with 30% weighted recent monthly averages per category.
              </p>
            </div>
          </div>

          {/* VISUAL CHART: Actual vs Predicted */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Top Categories: Last Month vs Projected Next Month</h3>
              <span className="text-xs text-slate-400">Actual vs Statistical Estimate</span>
            </div>
            <div className="h-64 sm:h-72">
              <Bar data={compareChartData} options={compareOptions} />
            </div>
          </div>

          {/* DETAILED CATEGORY PREDICTIONS TABLE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Category Forecast Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Itemized estimates for every active spending category.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Historical Trend</th>
                    <th className="py-3 px-4 text-right">Last Month Actual</th>
                    <th className="py-3 px-4 text-right">Predicted Next Month</th>
                    <th className="py-3 px-4 text-right">Expected Range</th>
                    <th className="py-3 px-4 text-center">Trajectory</th>
                    <th className="py-3 px-4 text-center">Model Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {categories.map((c) => (
                    <tr key={c.category} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {c.category}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {c.historicalMonthly.map(h => `${currency}${Math.round(h.amount)}`).join(' → ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {currency}{c.lastMonthAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-300 text-sm">
                        {currency}{c.predictedAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                        {currency}{c.lowerBound.toLocaleString()} – {currency}{c.upperBound.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                          c.trend === 'upward' ? 'text-rose-400' : (c.trend === 'downward' ? 'text-emerald-400' : 'text-slate-400')
                        }`}>
                          {c.trend === 'upward' ? `↗ +${c.trendPct}%` : (c.trend === 'downward' ? `↘ ${c.trendPct}%` : '→ Stable')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {c.confidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transparency & Disclaimer Box */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-3">
            <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-200">Statistical Estimation Transparency:</strong> {data?.disclaimer}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
