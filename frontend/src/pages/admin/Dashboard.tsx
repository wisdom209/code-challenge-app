import React, { useEffect, useState } from 'react';
import { adminApiService, TaskStats } from '../../services/adminApi';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await adminApiService.getStats();
        setStats(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

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
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tasks', value: stats?.totalTasks || 0, color: 'neon-cyan' },
          { label: 'Active Tasks', value: stats?.activeTasks || 0, color: 'neon-green' },
          { label: 'Categories', value: Object.keys(stats?.byCategory || {}).length, color: 'neon-purple' },
          { label: 'Languages', value: Object.keys(stats?.byLanguage || {}).length, color: 'neon-yellow' },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-dark-800 border-2 border-dark-600 rounded-lg p-6 hover:border-neon-cyan/30 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-4xl text-${stat.color}`}>📊</span>
              <span className={`text-${stat.color} font-display font-bold text-3xl`}>
                {stat.value}
              </span>
            </div>
            <p className="text-gray-400 font-mono text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Difficulty Distribution */}
      <div className="bg-dark-800 border-2 border-dark-600 rounded-lg p-6">
        <h3 className="text-xl font-display font-bold text-white mb-4">
          Tasks by Difficulty
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats?.byDifficulty || {}).map(([difficulty, count]) => (
            <div key={difficulty} className="text-center p-4 bg-dark-700 rounded-lg">
              <div className="text-2xl font-bold text-neon-cyan mb-2">{count}</div>
              <div className="text-sm font-mono text-gray-400 capitalize">
                {difficulty}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-dark-800 border-2 border-dark-600 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-display font-bold text-white">
            Recent Tasks
          </h3>
          <Link
            to="/admin/tasks"
            className="text-neon-cyan hover:text-neon-cyan/80 font-mono text-sm"
          >
            View All →
          </Link>
        </div>
        <div className="space-y-3">
          {stats?.recentTasks?.map((task: any) => (
            <div
              key={task._id}
              className="flex items-center justify-between p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
            >
              <div>
                <h4 className="font-display font-semibold text-white">{task.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-gray-400 capitalize">
                    {task.category}
                  </span>
                  <span className="text-xs font-mono text-neon-cyan">
                    {task.difficulty}
                  </span>
                </div>
              </div>
              <Link
                to={`/admin/tasks/edit/${task._id}`}
                className="text-neon-purple hover:text-neon-purple/80 font-mono text-sm"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/admin/tasks/new"
          className="bg-gradient-to-br from-neon-cyan to-neon-purple p-6 rounded-lg text-center hover:shadow-lg hover:shadow-neon-cyan/20 transition-all"
        >
          <div className="text-5xl mb-2">➕</div>
          <div className="font-display font-bold text-white text-lg">
            Create New Task
          </div>
        </Link>
        <Link
          to="/admin/tasks"
          className="bg-dark-800 border-2 border-neon-cyan p-6 rounded-lg text-center hover:border-neon-cyan/50 hover:shadow-lg hover:shadow-neon-cyan/20 transition-all"
        >
          <div className="text-5xl mb-2">📝</div>
          <div className="font-display font-bold text-white text-lg">
            Manage Tasks
          </div>
        </Link>
      </div>
    </div>
  );
};

