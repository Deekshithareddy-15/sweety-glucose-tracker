import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid login credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill demo credentials
  const fillDemo = () => {
    setFormData({
      email: 'demo@sweety.local',
      password: 'Demo@12345',
    });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50/70 via-purple-50/40 to-emerald-50/40">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl shadow-pink-100/50 border border-pink-100/80">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-400 via-rose-400 to-purple-400 items-center justify-center text-white shadow-md shadow-pink-200 mb-3">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Welcome to <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Sweety</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Blood Glucose Tracker for daily wellness & health insights
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-300 focus:border-pink-400 bg-slate-50/50"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-300 focus:border-pink-400 bg-slate-50/50"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-md shadow-pink-200 focus:outline-hidden focus:ring-2 focus:ring-pink-300 disabled:opacity-60 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Helper */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400">Testing reviewer?</span>
          <button
            type="button"
            onClick={fillDemo}
            className="text-pink-600 hover:text-pink-700 font-semibold hover:underline"
          >
            Fill Demo Credentials
          </button>
        </div>

        {/* Sign up link */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-pink-600 hover:text-pink-700 font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
