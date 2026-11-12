import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Boxes, Lock, Mail, ArrowRight, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, quickSwitchUser, isLoading, error } = useAuthStore();
  const { fetchCart } = useCartStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      await fetchCart();
      const user = useAuthStore.getState().user;
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/catalogue');
      }
    } else {
      setLocalError(res.message);
    }
  };

  const handleQuickDemoLogin = async (role) => {
    await quickSwitchUser(role);
    await fetchCart();
    const user = useAuthStore.getState().user;
    if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/catalogue');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-teal-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-700/25">
            <Boxes className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            Wholesale<span className="text-teal-700">Hub</span> Portal
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sign in to access personalized wholesale pricing, credit ordering, and account receivables.
          </p>
        </div>

        {/* 1-Click Demo Evaluation Selector */}
        <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-200/80">
          <div className="flex items-center space-x-1.5 text-teal-900 font-bold text-xs mb-2">
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>Fast 1-Click Evaluation Logins:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="py-1.5 px-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 text-[11px] text-center"
            >
              👑 Administrator
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('platinum')}
              className="py-1.5 px-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 text-[11px] text-center"
            >
              💎 Platinum Retailer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('gold')}
              className="py-1.5 px-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 text-[11px] text-center"
            >
              🥇 Gold Retailer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('pending')}
              className="py-1.5 px-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 text-[11px] text-center"
            >
              ⏳ Pending Approval
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {(localError || error) && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Business Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="purchasing@company.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Account Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-md shadow-teal-700/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center">
                Sign In to WholesaleHub
                <ArrowRight className="w-4 h-4 ml-2" />
              </span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            Don't have an approved wholesale account yet?{' '}
            <Link to="/register" className="font-bold text-teal-700 hover:text-teal-800">
              Apply for Retailer Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
