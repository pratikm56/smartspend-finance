import React from 'react';
import { 
  Sparkles, TrendingUp, ShieldCheck, ArrowRight, LineChart, 
  PieChart, Target, Bot, CheckCircle2, ChevronRight, Zap, Lock
} from 'lucide-react';

export default function LandingPage({ onOpenAuth }) {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/85 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">SmartSpend</span>
              <span className="text-[10px] ml-1.5 uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/25 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles size={14} className="text-indigo-400" />
            <span>AI-Powered Personal Finance & Spending Analytics</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Master Your Money with <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400 bg-clip-text text-transparent">
              Predictive Intelligence & AI
            </span>
          </h1>

          {/* Core Philosophy tagline */}
          <div className="mt-5 text-sm sm:text-base font-semibold text-indigo-400/90 tracking-wide uppercase">
            Track → Understand → Predict → Improve
          </div>

          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            SmartSpend replaces outdated expense trackers with a high-fidelity financial cockpit. 
            Automated budget health, statistical future expense forecasting, and your private SmartSpend AI assistant.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
            >
              <span>Launch Your Cockpit Free</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold transition cursor-pointer text-sm sm:text-base"
            >
              Sign In to Existing Account
            </button>
          </div>

          {/* Interactive Live Preview Card */}
          <div className="mt-14 max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Financial Snapshot</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">₹65,000 Inflow</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                    +38.5% Savings Rate
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Financial Health: <strong>88/100 (Excellent)</strong></span>
              </div>
            </div>

            {/* Preview Mini KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-slate-800">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                <p className="text-[11px] text-slate-400">Total Income</p>
                <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">₹65,000</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                <p className="text-[11px] text-slate-400">Total Expenses</p>
                <p className="text-base sm:text-lg font-bold text-rose-400 mt-0.5">₹40,000</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                <p className="text-[11px] text-slate-400">Net Savings</p>
                <p className="text-base sm:text-lg font-bold text-indigo-400 mt-0.5">₹25,000</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                <p className="text-[11px] text-slate-400">Predicted Next Month</p>
                <p className="text-base sm:text-lg font-bold text-amber-400 mt-0.5">₹38,200</p>
              </div>
            </div>

            {/* AI Assistant Preview Snippet */}
            <div className="pt-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0">
                <Bot size={16} />
              </div>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800/80 flex-1">
                <strong className="text-violet-300">SmartSpend AI ✨:</strong> "Your food spending increased by 14% this month, but rent and utility caps kept you under budget. Your current savings rate is 38.5%!"
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 sm:py-24 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Designed for Real Financial Control
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-400">
              Every feature is built around actionable financial clarity, not static records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">Intuitive Expense & Income</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Log earnings and outflows in seconds with instant categorization, custom tags, payment method tracking, and date filters.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                <PieChart size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">Dynamic Budget Tracking</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Set monthly category caps. Visual color-coded warning states notify you before budgets are exhausted or exceeded.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
                <LineChart size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">Future Expense Forecasting</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Statistical regression and moving averages calculate next month's expected expenditure per category with confidence intervals.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Target size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">Savings Goals & Pacing</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Set targets for gadgets, travel, or emergency funds. Track required monthly pace, days remaining, and celebratory completions.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">SmartSpend AI ✨ Assistant</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Converse with your private financial intelligence agent. Ask about top spending, comparisons, savings tips, and budget health.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">Bank-Grade User Isolation</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Strict authenticated identity guarantees absolute privacy. One user can never access or modify another user's financial ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="mt-auto border-t border-slate-800 py-10 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="font-semibold text-slate-300">SmartSpend AI</span>
            <span>– Modern Personal Finance & Spending Analytics</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Encrypted Ledger</span>
            <span>•</span>
            <span>OTP Verification</span>
            <span>•</span>
            <span>Statistical Forecasts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
