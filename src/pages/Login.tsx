import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23f3f3f3' fill-opacity='0.4' d='m1,3h1v1h-1v-1zm2-2h1v1h-1v-1z'/%3E%3C/svg%3E")`
    }}>
      <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-3">
            {isLogin ? 'Welcome back' : 'Join boksu.ai'}
          </h2>
          <p className="text-gray-600 text-lg">
            {isLogin 
              ? 'Sign in to access your audio summaries' 
              : 'Start generating personalized book summaries'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900"
              disabled={loading}
              required
            />
          </div>

          <Button
            className="w-full py-3 bg-gray-900 text-white hover:bg-gray-800 font-semibold text-lg rounded-lg transition-all duration-200"
            disabled={loading || !email || !password}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
            disabled={loading}
          >
            {isLogin 
              ? "Don't have an account? Create one" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link 
            to="/"
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};