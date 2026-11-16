import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  User, Mail, Key, Lock, ShieldCheck, Database, 
  Trash2, Save, Check, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react';

const CURRENCIES = [
  { symbol: '₹', name: 'INR (Indian Rupee - ₹)' },
  { symbol: '$', name: 'USD (US Dollar - $)' },
  { symbol: '€', name: 'EUR (Euro - €)' },
  { symbol: '£', name: 'GBP (British Pound - £)' },
  { symbol: '¥', name: 'JPY (Japanese Yen - ¥)' },
  { symbol: 'AED ', name: 'AED (UAE Dirham)' }
];

export default function ProfileView({ onDataRefresh }) {
  const { user, currency, updateProfile, changePassword, logout } = useAuth();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || '₹');
  const [savingsTarget, setSavingsTarget] = useState(user?.monthly_savings_target_pct || 20);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  // Demo Data state
  const [dataActionLoading, setDataActionLoading] = useState(false);
  const [dataActionMsg, setDataActionMsg] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    setProfileErr('');

    try {
      const payload = {
        name,
        currency: selectedCurrency,
        monthly_savings_target_pct: parseFloat(savingsTarget)
      };
      if (geminiApiKey.trim()) {
        payload.gemini_api_key = geminiApiKey.trim();
      }
      await updateProfile(payload);
      setProfileMsg('Profile and preferences updated successfully!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileErr(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordErr('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErr('New password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg('');
    setPasswordErr('');

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch (err) {
      setPasswordErr(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLoadSampleData = async () => {
    setDataActionLoading(true);
    setDataActionMsg('');
    try {
      await api.post('/seed/demo-data');
      setDataActionMsg('Realistic fintech demo data loaded successfully!');
      if (onDataRefresh) onDataRefresh();
      setTimeout(() => setDataActionMsg(''), 3000);
    } catch (err) {
      alert('Failed to load sample data.');
    } finally {
      setDataActionLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('WARNING: This will permanently delete all your transactions, budgets, goals, and chat messages. Proceed?')) return;
    setDataActionLoading(true);
    setDataActionMsg('');
    try {
      await api.post('/seed/clear-data');
      setDataActionMsg('All personal financial records cleared.');
      if (onDataRefresh) onDataRefresh();
      setTimeout(() => setDataActionMsg(''), 3000);
    } catch (err) {
      alert('Failed to clear records.');
    } finally {
      setDataActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Account & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Manage your personal profile, preferred currency, target goals, and security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Profile & Preferences */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <User size={18} className="text-indigo-400" />
            <h2 className="font-bold text-base text-white">Profile Details</h2>
          </div>

          {profileMsg && (
            <div className="p-3 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded-xl">
              {profileMsg}
            </div>
          )}
          {profileErr && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 rounded-xl">
              {profileErr}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 uppercase">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 uppercase">Email Address (Verified)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 uppercase">Display Currency</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {CURRENCIES.map(c => (
                  <option key={c.symbol} value={c.symbol} className="bg-slate-900">{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-300 uppercase">Monthly Savings Target</label>
                <span className="font-bold text-indigo-400 font-mono">{savingsTarget}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Used by AI algorithms to score your savings health.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 uppercase">
                Custom Google Gemini API Key (Optional)
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder={user?.hasCustomApiKey ? '••••••••••••••••••••••••' : 'AIzaSy... (BYOK)'}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Leave blank to use SmartSpend's high-speed built-in financial intelligence engine.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {profileLoading ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. Security & Password Change */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Lock size={18} className="text-indigo-400" />
            <h2 className="font-bold text-base text-white">Security & Password</h2>
          </div>

          {passwordMsg && (
            <div className="p-3 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded-xl">
              {passwordMsg}
            </div>
          )}
          {passwordErr && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 rounded-xl">
              {passwordErr}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 uppercase">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 uppercase">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 uppercase">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {passwordLoading ? <RefreshCw className="animate-spin" size={14} /> : <Key size={14} />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Demo Data Management & Evaluation Cockpit */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Database size={18} className="text-indigo-400" />
          <h2 className="font-bold text-base text-white">Data Management & Evaluator Tools</h2>
        </div>

        {dataActionMsg && (
          <div className="p-3 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded-xl">
            {dataActionMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Sparkles size={16} className="text-violet-400" />
              Realistic Demo Dataset
            </h3>
            <p className="text-xs text-slate-400">
              Instantly seed 4 months of transactions, active category budgets, and savings goals for evaluation and testing.
            </p>
            <button
              onClick={handleLoadSampleData}
              disabled={dataActionLoading}
              className="mt-2 w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              {dataActionLoading ? 'Processing...' : 'Load Sample Fintech Data'}
            </button>
          </div>

          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
            <h3 className="font-bold text-sm text-rose-300 flex items-center gap-1.5">
              <Trash2 size={16} className="text-rose-400" />
              Clear Personal Records
            </h3>
            <p className="text-xs text-slate-400">
              Reset all personal transactions, budgets, goals, and chat messages for a clean slate.
            </p>
            <button
              onClick={handleClearAllData}
              disabled={dataActionLoading}
              className="mt-2 w-full py-2 px-3 bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-800/40 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              {dataActionLoading ? 'Processing...' : 'Clear All My Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
