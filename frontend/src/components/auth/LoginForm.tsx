import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../shared/Button';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/languages');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-dark-800 border-2 border-neon-cyan/30 rounded-lg p-8 shadow-2xl shadow-neon-cyan/10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400 font-mono text-sm">Login to continue your coding journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-neon-pink/10 border border-neon-pink/50 rounded-lg">
            <p className="text-neon-pink text-sm font-mono">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none transition-colors"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            Login
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm font-mono">
            Don't have an account?{' '}
            <Link to="/register" className="text-neon-cyan hover:text-neon-cyan/80 font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

