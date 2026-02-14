import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../shared/Button';

export const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityQuestion, _] = useState(
    'What is your favourite programming language?'
  );
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        username,
        email,
        password,
        securityQuestion,
        securityAnswer,
      });
      navigate('/languages');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-dark-800 border-2 border-neon-purple/30 rounded-lg p-8 shadow-2xl shadow-neon-purple/10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">
            Create Account
          </h2>
          <p className="text-gray-400 font-mono text-sm">
            Start your coding adventure
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-neon-pink/10 border border-neon-pink/50 rounded-lg">
            <p className="text-neon-pink text-sm font-mono">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-purple focus:outline-none transition-colors"
              placeholder="codewizard"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-purple focus:outline-none transition-colors"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-purple focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-purple focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="text"
              value={securityQuestion}
              disabled
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-purple focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-purple focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm font-mono">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-neon-purple hover:text-neon-purple/80 font-semibold"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

