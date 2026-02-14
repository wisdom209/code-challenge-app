import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Task } from '../types';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

interface CategoryGroup {
  category: string;
  tasks: Task[];
  count: number;
}

export const CategorySelection: React.FC = () => {
  const { language } = useParams<{ language: string }>();
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      if (!language) return;

      try {
        setIsLoading(true);
        const tasks = await apiService.getTasksByLanguage(language);

        // Group tasks by category
        const categoryMap = new Map<string, Task[]>();
        tasks.forEach((task) => {
          const existing = categoryMap.get(task.category) || [];
          categoryMap.set(task.category, [...existing, task]);
        });

        const grouped = Array.from(categoryMap.entries()).map(([category, tasks]) => ({
          category,
          tasks,
          count: tasks.length,
        }));

        setCategories(grouped);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [language]);

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
        <Link to="/languages" className="text-neon-cyan hover:underline font-mono">
          ← Back to languages
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <Link
          to="/languages"
          className="inline-flex items-center gap-2 text-neon-cyan hover:text-neon-cyan/80 font-mono mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Languages
        </Link>

        <h1 className="text-5xl font-display font-bold text-white mb-4 capitalize">
          {language} Challenges
        </h1>
        <p className="text-xl text-gray-400 font-mono">
          Choose a category to start practicing
        </p>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-display font-bold text-gray-400 mb-2">
            No challenges yet
          </h3>
          <p className="text-gray-500 font-mono">
            Check back soon for new content!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.category}
              to={`/languages/${language}/${category.category}`}
              className="group"
            >
              <div className="bg-dark-800 border-2 border-dark-600 hover:border-neon-purple rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/20 hover:-translate-y-1 h-full">
                {/* Category Icon */}
                <div className="w-16 h-16 mb-4 bg-gradient-to-br from-neon-purple to-neon-pink rounded-lg flex items-center justify-center text-3xl transform group-hover:scale-110 transition-transform">
                  📚
                </div>

                {/* Category Name */}
                <h3 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-neon-purple transition-colors capitalize">
                  {category.category.replace(/-/g, ' ')}
                </h3>

                {/* Task Count */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-mono text-gray-400">
                    {category.count} {category.count === 1 ? 'challenge' : 'challenges'}
                  </span>
                  <div className="flex gap-1">
                    {category.tasks.slice(0, 3).map((task, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          task.difficulty === 'easy'
                            ? 'bg-green-500'
                            : task.difficulty === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-pink-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2 text-neon-purple font-mono text-sm">
                  <span>View Challenges</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

