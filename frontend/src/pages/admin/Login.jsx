import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2, Eye, EyeOff, Pizza } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import loginBg from '../../assets/pizza_login_bg.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-between p-6 select-none relative overflow-x-hidden font-sans">
      {/* Background illustration */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-90 hidden md:block" 
        style={{ backgroundImage: `url(${loginBg})` }} 
      />

      {/* Circular Logo Badge on Top Left */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5 z-10">
        <div className="relative w-14 h-14 rounded-full border border-dashed border-[#e91e63] p-1 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full bg-[#e91e63] flex items-center justify-center text-white shadow-sm">
            <Pizza className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-xs tracking-wider text-gray-800 uppercase">FoodExpress</span>
          <span className="text-[9px] text-[#e91e63] font-bold tracking-widest uppercase mt-0.5">Management Portal</span>
        </div>
      </div>

      {/* Empty space to push header down */}
      <div className="h-12" />

      {/* Main card and headers */}
      <div className="flex flex-col items-center justify-center w-full max-w-[410px] my-auto z-10">
        {/* Page Header */}
        <div className="text-center mb-6">
          <span className="text-xs font-black tracking-[0.25em] text-[#e91e63] uppercase block mb-1">FOODEXPRESS</span>
          <h1 className="text-4xl font-extrabold font-serif text-gray-900 tracking-tight">Login</h1>
          <p className="text-[11px] text-gray-400 font-bold mt-2">
            More than <span className="text-[#e91e63]">35,000 recipes</span> from around the world!
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full bg-white shadow-2xl rounded-[32px] p-8 border border-gray-100/50 relative">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="leading-normal">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Address */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="Enter Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-150 focus:border-[#e91e63] focus:bg-white rounded-full text-xs font-semibold text-gray-800 placeholder-gray-400 outline-none transition-all duration-200"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-150 focus:border-[#e91e63] focus:bg-white rounded-full text-xs font-semibold text-gray-800 placeholder-gray-400 outline-none transition-all duration-200"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-450 hover:text-gray-650 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Checkbox & Forgot Password */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#e91e63] focus:ring-[#e91e63] w-3.5 h-3.5"
                />
                <span className="text-[11px] text-gray-450 font-bold">Remember me</span>
              </label>
              <span className="text-[11px] text-gray-450 hover:text-[#e91e63] font-bold hover:underline cursor-pointer">
                Forgot Password?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#e91e63] hover:bg-[#d81b60] active:scale-[0.98] rounded-full text-xs font-bold text-white shadow-lg shadow-pink-500/10 flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>LOGIN</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6 px-1">
            <div className="flex-grow border-t border-gray-150" />
            <span className="px-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-white">Login with</span>
            <div className="flex-grow border-t border-gray-150" />
          </div>

          {/* Social Logins */}
          <div className="flex justify-center gap-5">
            <button
              type="button"
              className="w-10 h-10 rounded-full border border-gray-150 hover:bg-gray-50 flex items-center justify-center text-blue-600 shadow-sm transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
              </svg>
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-full border border-gray-150 hover:bg-gray-50 flex items-center justify-center text-red-500 shadow-sm transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.44-2.885-6.44-6.44s2.885-6.44 6.44-6.44c1.633 0 3.12.616 4.256 1.62l3.24-3.24C19.28 2.22 15.938 1 12.24 1 5.922 1 1 5.922 1 12s4.922 11 11.24 11c6.578 0 11.24-4.662 11.24-11.24 0-.76-.085-1.492-.24-2.185H12.24z" />
              </svg>
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-full border border-gray-150 hover:bg-gray-50 flex items-center justify-center text-sky-400 shadow-sm transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-t border-gray-200/50 mt-12 z-10">
        {/* Footer Navigation Links */}
        <div className="flex flex-wrap justify-center gap-6">
          <span className="text-[10px] text-gray-500 font-bold hover:text-[#e91e63] transition-colors cursor-pointer">Explore</span>
          <span className="text-[10px] text-gray-500 font-bold hover:text-[#e91e63] transition-colors cursor-pointer">What</span>
          <span className="text-[10px] text-gray-500 font-bold hover:text-[#e91e63] transition-colors cursor-pointer">Help & Feedback</span>
          <span className="text-[10px] text-gray-500 font-bold hover:text-[#e91e63] transition-colors cursor-pointer">Contact</span>
        </div>

        {/* Footer Social Icons & Copyright */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 hover:text-[#e91e63] transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
              </svg>
            </span>
            <span className="text-gray-400 hover:text-[#e91e63] transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </span>
            <span className="text-gray-400 hover:text-[#e91e63] transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </span>
          </div>
          <span className="text-[9px] text-gray-400 font-bold tracking-wide">
            © 2026 FoodExpress. All rights reserved.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
