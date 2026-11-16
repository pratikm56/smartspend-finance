import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const { login, register, verifyEmail, resendOtp, getLatestOtp, forgotPassword, resetPassword } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'verify' | 'forgot' | 'reset'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    otp: '',
    newPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setSuccess('');
  }, [initialMode, isOpen]);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (mode === 'verify' || mode === 'reset') {
      if (countdown > 0) {
        timer = setInterval(() => setCountdown(c => c - 1), 1000);
      } else {
        setCanResend(true);
      }
    }
    return () => clearInterval(timer);
  }, [countdown, mode]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await register(formData.name, formData.email, formData.password);
      setSuccess(res.message);
      setMode('verify');
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await login(formData.email, formData.password);
      if (onSuccess) onSuccess(res.user);
      onClose();
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        setMode('verify');
        setError(err.response.data.error);
        setCountdown(60);
        setCanResend(false);
      } else {
        setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await verifyEmail(formData.email, formData.otp);
      setSuccess('Email verified successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess(res.user);
        onClose();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setError('');
    try {
      const purpose = mode === 'reset' ? 'RESET_PASSWORD' : 'VERIFY_EMAIL';
      const res = await resendOtp(formData.email, purpose);
      setSuccess('A new 6-digit OTP code has been dispatched to your email!');
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFillOtp = async () => {
    if (!formData.email) {
      setError('Please provide your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getLatestOtp(formData.email);
      if (data && data.otp) {
        setFormData(prev => ({ ...prev, otp: data.otp }));
        setSuccess(`OTP code auto-retrieved: ${data.otp}!`);
      } else {
        setError('No active code found.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not fetch code. Please check server logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await forgotPassword(formData.email);
      setSuccess(res.message);
      setMode('reset');
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await resetPassword(formData.email, formData.otp, formData.newPassword);
      setSuccess(res.message);
      setTimeout(() => {
        setMode('login');
        setFormData(prev => ({ ...prev, password: '', otp: '', newPassword: '' }));
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/30 mb-3">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'login' && 'Welcome Back to SmartSpend'}
            {mode === 'register' && 'Create Your Account'}
            {mode === 'verify' && 'Verify Your Email'}
            {mode === 'forgot' && 'Reset Your Password'}
            {mode === 'reset' && 'Set New Password'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'login' && 'Sign in to access your personal finance intelligence cockpit.'}
            {mode === 'register' && 'Start tracking, predicting, and optimizing your spending.'}
            {mode === 'verify' && `We sent a 6-digit code to ${formData.email || 'your email'}. Check your inbox!`}
            {mode === 'forgot' && 'Enter your email to receive a secure recovery code.'}
            {mode === 'reset' && `We sent a 6-digit code to ${formData.email || 'your email'}. Enter it below.`}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-sm text-rose-300 bg-rose-950/50 border border-rose-800/80 rounded-xl">
            <AlertCircle size={18} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 p-3 text-sm text-emerald-300 bg-emerald-950/50 border border-emerald-800/80 rounded-xl">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@fintech.io"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Sign In'}
              {!loading && <ArrowRight size={18} />}
            </button>

            <div className="text-center pt-2 text-sm text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Create one now
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Pratik Sharma"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="pratik@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Password (Min 6 chars)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Create Account'}
              {!loading && <ArrowRight size={18} />}
            </button>

            <div className="text-center pt-2 text-sm text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. VERIFY EMAIL OTP */}
        {mode === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                name="otp"
                maxLength={6}
                required
                autoFocus
                value={formData.otp}
                onChange={handleChange}
                placeholder="123456"
                className="w-full py-3 px-4 text-center tracking-[0.5em] font-mono text-2xl font-bold bg-slate-800/90 border border-indigo-500/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Code expires in 10 minutes</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Resend OTP
                </button>
              ) : (
                <span className="text-slate-500">Resend in {countdown}s</span>
              )}
            </div>

            <div className="text-center -mt-1">
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer py-1 inline-flex items-center gap-1"
              >
                <span>Didn't receive email? Click to fetch code</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || formData.otp.length < 6}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Verify & Continue'}
              <ShieldCheck size={18} />
            </button>

            <div className="text-center pt-2 text-sm text-slate-400">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* 4. FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@fintech.io"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Send Reset Code to Email'}
              {!loading && <ArrowRight size={18} />}
            </button>

            <div className="text-center pt-2 text-sm text-slate-400">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* 5. RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">6-Digit Email Reset Code</label>
                <span className="text-[11px] text-indigo-300 font-mono truncate max-w-[180px]">{formData.email}</span>
              </div>
              <input
                type="text"
                name="otp"
                maxLength={6}
                required
                autoFocus
                value={formData.otp}
                onChange={handleChange}
                placeholder="123456"
                className="w-full py-3 px-4 text-center tracking-[0.5em] font-mono text-2xl font-bold bg-slate-800/90 border border-indigo-500/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Code expires in 10 minutes</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Resend Code
                </button>
              ) : (
                <span className="text-slate-500">Resend in {countdown}s</span>
              )}
            </div>

            <div className="text-center -mt-1">
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer py-1 inline-flex items-center gap-1"
              >
                <span>Didn't receive email? Click to fetch code</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  required
                  minLength={6}
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || formData.otp.length < 6}
              className="w-full py-3 px-4 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Save New Password'}
            </button>

            <div className="text-center pt-2 text-sm text-slate-400">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
