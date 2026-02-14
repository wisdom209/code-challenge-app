import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Task } from '../types';
import { TaskList } from '../components/tasks/TaskList';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

export const CategoryTasks: React.FC = () => {
  const { language, category } = useParams<{ language: string; category: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      if (!language || !category) return;
      try {
        setIsLoading(true);
        const fetchedTasks = await apiService.getTasksByCategory(language, category);
        setTasks(fetchedTasks);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [language, category]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-neon-pink text-xl font-mono mb-4">⚠️ {error}</div>
        <Link to={`/languages/${language}/categories`} className="text-neon-cyan hover:underline font-mono">
          ← Back to categories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/languages/${language}/categories`}
          className="inline-flex items-center gap-2 text-neon-cyan hover:text-neon-cyan/80 font-mono mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Categories
        </Link>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-white capitalize">
              {category?.replace(/-/g, ' ')}
            </h1>
            <p className="text-xl text-gray-400 font-mono">
              Complete these challenges to master {category?.replace(/-/g, ' ')}
            </p>
          </div>
          <span className="px-4 py-2 bg-dark-700 border border-neon-cyan/30 rounded-full text-neon-cyan font-mono text-sm self-start">
            {language?.toUpperCase()}
          </span>
        </div>

      </div>

      {/* Tasks List */}
      <TaskList tasks={tasks} showLanguage={false} />
    </div>
  );
};

