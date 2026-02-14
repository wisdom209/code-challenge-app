import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/shared/Button';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-4">
        {/* Hero Section */}
        <div className="mb-12 animate-slide-in">
          <div className="mb-8">
            <span className="inline-block text-7xl mb-6 animate-pulse-slow">💻</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-display font-bold mb-6 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
            Master Coding
            <br />
            One Challenge at a Time
          </h1>
          <p className="text-xl text-gray-400 font-mono mb-8 max-w-2xl mx-auto">
            Level up your programming skills with hands-on challenges in Python and C.
            Write code, run tests, and track your progress.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          {isAuthenticated ? (
            <Link to="/languages">
              <Button variant="primary" size="lg" className="text-lg px-12">
                Start Coding →
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button variant="primary" size="lg" className="text-lg px-12">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" size="lg" className="text-lg px-12">
                  Login
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            {
              icon: '🐍',
              title: 'Python & C',
              description: 'Master fundamental programming languages',
              color: 'from-blue-500 to-yellow-500',
            },
            {
              icon: '⚡',
              title: 'Instant Feedback',
              description: 'Run tests and see results immediately',
              color: 'from-neon-cyan to-neon-purple',
            },
            {
              icon: '📊',
              title: 'Track Progress',
              description: 'Monitor your learning journey',
              color: 'from-neon-purple to-neon-pink',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-dark-800 border-2 border-dark-600 rounded-lg p-8 hover:border-neon-cyan/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-neon-cyan/10"
            >
              <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center text-3xl`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

