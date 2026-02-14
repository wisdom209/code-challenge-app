import React from 'react';
import { Link } from 'react-router-dom';
import { LANGUAGES } from '../utils/constants';

export const LanguageSelection: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-display font-bold text-white mb-4">
          Choose Your Language
        </h1>
        <p className="text-xl text-gray-400 font-mono">
          Select a programming language to start your journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {LANGUAGES.map((language) => (
          <Link
            key={language.id}
            to={`/languages/${language.id}/categories`}
            className="group"
          >
            <div className="bg-dark-800 border-2 border-dark-600 hover:border-neon-cyan rounded-2xl p-10 transition-all duration-300 hover:shadow-2xl hover:shadow-neon-cyan/20 hover:-translate-y-2">
              {/* Icon */}
              <div className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br ${language.color} rounded-2xl flex items-center justify-center text-5xl shadow-lg transform group-hover:scale-110 transition-transform`}>
                {language.icon}
              </div>

              {/* Title */}
              <h2 className="text-3xl font-display font-bold text-white text-center mb-4 group-hover:text-neon-cyan transition-colors">
                {language.name}
              </h2>

              {/* Description */}
              <p className="text-gray-400 font-mono text-center mb-6">
                {language.description}
              </p>

              {/* Action */}
              <div className="flex items-center justify-center gap-2 text-neon-cyan font-mono text-sm">
                <span>Select Language</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-16 grid grid-cols-3 gap-6">
        {[
          { label: 'Total Challenges', value: '50+' },
          { label: 'Languages', value: '2' },
          { label: 'Categories', value: '10+' },
        ].map((stat, index) => (
          <div
            key={index}
            className="text-center p-6 bg-dark-800 border border-dark-600 rounded-lg"
          >
            <div className="text-4xl font-display font-bold text-neon-cyan mb-2">
              {stat.value}
            </div>
            <div className="text-sm font-mono text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

