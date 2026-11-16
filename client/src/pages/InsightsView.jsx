import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  Sparkles, TrendingUp, AlertTriangle, AlertCircle, 
  CheckCircle2, Compass, ArrowRight, RefreshCw, Filter
} from 'lucide-react';

export default function InsightsView({ setActiveTab }) {
  const { currency } = useAuth();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'warning' | 'savings' | 'trend'

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.get('/insights');
      setInsights(res.data.insights || []);
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const filteredInsights = insights.filter((ins) => {
    if (filterType === 'all') return true;
    if (filterType === 'warning') return ins.severity === 'warning' || ins.severity === 'urgent';
    if (filterType === 'savings') return ins.type === 'savings_milestone';
    if (filterType === 'trend') return ins.type === 'trend' || ins.type === 'spending_pattern';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Financial Insights
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Live Analysis
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time algorithmic observations extracted from your actual transactions and budgets.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filterType === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Insights ({insights.length})
          </button>
          <button
            onClick={() => setFilterType('warning')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filterType === 'warning' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Alerts
          </button>
          <button
            onClick={() => setFilterType('savings')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filterType === 'savings' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Savings
          </button>
          <button
            onClick={() => setFilterType('trend')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filterType === 'trend' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Patterns
          </button>
        </div>
      </div>

      {/* INSIGHT CARDS STREAM */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse">
          Computing personalized financial insights...
        </div>
      ) : filteredInsights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInsights.map((ins, idx) => {
            let borderClass = 'border-slate-800';
            let bgClass = 'bg-slate-900/90';
            let icon = <Compass className="text-indigo-400" size={20} />;
            let badgeBg = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';

            if (ins.severity === 'urgent') {
              borderClass = 'border-rose-800/80';
              bgClass = 'bg-rose-950/20';
              icon = <AlertCircle className="text-rose-400" size={20} />;
              badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            } else if (ins.severity === 'warning') {
              borderClass = 'border-amber-800/80';
              bgClass = 'bg-amber-950/20';
              icon = <AlertTriangle className="text-amber-400" size={20} />;
              badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            } else if (ins.severity === 'success') {
              borderClass = 'border-emerald-800/80';
              bgClass = 'bg-emerald-950/20';
              icon = <CheckCircle2 className="text-emerald-400" size={20} />;
              badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            }

            return (
              <div
                key={ins.id || idx}
                className={`p-6 ${bgClass} border ${borderClass} rounded-2xl shadow-lg flex flex-col justify-between hover:border-slate-700 transition`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0">
                        {icon}
                      </div>
                      <h3 className="font-bold text-base text-white">{ins.title}</h3>
                    </div>

                    {ins.metric && (
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeBg}`}>
                        {ins.metric}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-11">
                    {ins.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 pl-11 flex items-center justify-between text-xs text-slate-400">
                  <span className="capitalize text-[11px] font-semibold text-slate-500">
                    Category: {ins.type.replace('_', ' ')}
                  </span>
                  {ins.actionText && (
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{ins.actionText}</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
          <p className="text-sm text-slate-400">No insights currently match this filter.</p>
        </div>
      )}

      {/* Notice on Real Data Basis */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-500 flex items-center gap-2">
        <Sparkles size={16} className="text-violet-400 shrink-0" />
        <span>Insights are generated strictly from your personal transaction ledger and active budget goals. No fabricated data.</span>
      </div>
    </div>
  );
}
