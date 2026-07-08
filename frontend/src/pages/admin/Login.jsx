import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      if (data.user?.role !== 'admin') {
        throw new Error('Access Denied: Admin privileges required.');
      }

      // Save token and user details
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));

      // Redirect to main admin dashboard
      navigate('/admin/food-management');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 select-none relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-[420px] bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-650 text-white font-black text-xl mb-4 shadow-lg shadow-indigo-500/20">
            FE
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight leading-none">FoodExpress</h1>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 inline-block">
            Management Portal
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-semibold flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="leading-normal">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="admin@foodexpress.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-850 rounded-2xl text-xs font-medium text-white placeholder-slate-650 focus:border-indigo-500 focus:bg-slate-900 outline-none transition-all duration-200"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-850 rounded-2xl text-xs font-medium text-white placeholder-slate-650 focus:border-indigo-500 focus:bg-slate-900 outline-none transition-all duration-200"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-550 active:scale-[0.98] rounded-2xl text-xs font-bold text-white shadow-lg shadow-indigo-650/15 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Secure Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8 border-t border-slate-900 pt-6">
          <p className="text-[10px] font-medium text-slate-550 uppercase tracking-wider">
            Protected by JWT & TLS Encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
