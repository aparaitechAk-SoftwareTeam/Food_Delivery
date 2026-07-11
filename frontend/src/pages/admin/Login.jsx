import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import loginBg from '../../assets/login_bg.png';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 select-none font-sans relative overflow-hidden">
      
      {/* Background Image with Blur and Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={loginBg} 
          alt="Login Background" 
          className="w-full h-full object-cover filter blur-[3px] scale-105"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="w-full max-w-4xl bg-white rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:flex-row min-h-[550px] relative z-10">
        
        {/* Left Side: Solid Red Card with Overlapping Food Cards */}
        <div className="w-full md:w-[45%] bg-red-650 p-8 flex items-center justify-center relative min-h-[350px] md:min-h-auto overflow-hidden">
          {/* Overlapping food images mimicking the mock */}
          <div className="relative w-full h-full max-w-[280px] max-h-[380px] aspect-[3/4] flex items-center justify-center">
            
            {/* Main Center Image Container */}
            <div className="absolute w-[180px] h-[240px] bg-white p-1 rounded-2xl shadow-xl z-10 transform -rotate-3 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80" 
                alt="Skewers Platter" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            
            {/* Card 1: Top Right Salad */}
            <div className="absolute -top-4 -right-4 w-[110px] h-[110px] bg-white p-1 rounded-xl shadow-lg transform rotate-6 z-20 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80" 
                alt="Fresh Salad" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            
            {/* Card 2: Left Middle Platter */}
            <div className="absolute top-[35%] -left-8 w-[120px] h-[100px] bg-white p-1 rounded-xl shadow-lg z-20 transform -rotate-12 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80" 
                alt="Platter" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            
            {/* Card 3: Bottom Center Burger */}
            <div className="absolute -bottom-6 left-[25%] w-[130px] h-[110px] bg-white p-1 rounded-xl shadow-lg z-25 transform rotate-6 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80" 
                alt="Burger" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-[55%] p-8 md:p-14 flex flex-col justify-center bg-white z-20">
          <div className="w-full max-w-sm mx-auto">
            
            {/* App Branding */}
            <h1 className="text-3xl font-black text-red-650 tracking-tight text-center md:text-left mb-8">
              Food Express
            </h1>

            {/* Sub-Title */}
            <h2 className="text-base font-bold text-red-650 mb-5 tracking-wide">
              Admin Login
            </h2>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="leading-normal">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <User className="w-4 h-4 text-red-650" />
                </span>
                <input
                  type="email"
                  placeholder="Email/Phone no."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-350 rounded-2xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none transition-all duration-150"
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-red-650" />
                </span>
                <input
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-350 rounded-2xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none transition-all duration-150"
                  disabled={loading}
                />
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <a href="#forgot" className="text-[11px] font-bold text-red-650 hover:underline">
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-orange-500 hover:bg-orange-500 active:scale-[0.99] rounded-full text-xs font-bold text-white shadow-md transition-all duration-150 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            {/* Account Creation Footer Removed */}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
