import React, { useState } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { fetchApi } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const roleMap: Record<string, string> = {
  owner: 'owner',
  admin: 'admin',
  staff: 'staff',
  viewer: 'view_only'
};

const roleTitles: Record<string, string> = {
  owner: 'Owner Portal',
  admin: 'Admin Portal',
  staff: 'Staff Portal',
  viewer: 'Viewer Portal'
};

const LoginPage = () => {
  const { role } = useParams<{ role: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, logout } = useAuthStore();

  if (!role || !roleMap[role]) {
    return <Navigate to="/login" replace />;
  }

  const expectedRole = roleMap[role];
  const portalTitle = roleTitles[role];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { accessToken, user } = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (user.role !== expectedRole) {
        toast.error('Access Denied: Please use your designated login portal.');
        logout();
        return;
      }

      setAuth(user, accessToken);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      // Error handled by fetchApi
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest to-leaf/80 p-4">
      <div className="glass-card w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-forest/20 rounded-full blur-3xl -ml-10 -mb-10" />

        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 overflow-hidden p-1">
            <img src="/logo.png" alt="GVC Agro Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GVC Agro Finance</h1>
          <p className="text-forest font-medium mt-1">{portalTitle}</p>
        </div>

        <form onSubmit={handleLogin} className="relative z-10 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-leaf focus:border-leaf transition-all bg-white/50 backdrop-blur-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@gvcagro.lk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-leaf focus:border-leaf transition-all bg-white/50 backdrop-blur-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded text-leaf focus:ring-leaf" />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <Link to="/reset-password" className="text-sm font-medium text-forest hover:text-leaf transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest hover:bg-leaf text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="relative z-10 mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-forest inline-flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Portal Selection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
