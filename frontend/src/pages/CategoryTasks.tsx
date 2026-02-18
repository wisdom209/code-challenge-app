import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Task, ExecutionResult } from '../types';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Button } from '../components/shared/Button';
import { DIFFICULTY_COLORS, DIFFICULTY_BG } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

export const CategoryTasks: React.FC = () => {
  const { language, category } = useParams<{ language: string; category: string }>();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [githubUsernames, setGithubUsernames] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ExecutionResult | null>>({});

  useEffect(() => {
    const fetchTasks = async () => {
      if (!language || !category) return;
      try {
        setIsLoading(true);
        const fetchedTasks = await apiService.getTasksByCategory(language, category);
        setTasks(fetchedTasks);
        // Pre‑fill GitHub username with logged‑in user's username if available
        const initialUsernames: Record<string, string> = {};
        fetchedTasks.forEach(task => {
          initialUsernames[task._id] = user?.username || '';
        });
        setGithubUsernames(initialUsernames);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [language, category, user]);

  const toggleExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const handleGithubUsernameChange = (taskId: string, value: string) => {
    setGithubUsernames(prev => ({ ...prev, [taskId]: value }));
  };

  const handleRunTests = async (task: Task) => {
    const githubUsername = githubUsernames[task._id]?.trim();
    if (!githubUsername) {
      alert('Please enter your GitHub username');
      return;
    }
    setRunningTaskId(task._id);
    setResults(prev => ({ ...prev, [task._id]: null }));
    try {
      const result = await apiService.runTestsFromRepo({
        taskId: task._id,
        githubUsername,
        language: task.configs[0].language,
      });
      setResults(prev => ({ ...prev, [task._id]: result }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        [task._id]: {
          success: false,
          exitCode: -1,
          stdout: '',
          stderr: err.response?.data?.message || 'Failed to run tests',
          executionTime: 0,
          timedOut: false,
        },
      }));
    } finally {
      setRunningTaskId(null);
    }
  };

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
    <div className="max-w-5xl mx-auto">
      {/* Header with back link and "Learn" button */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          to={`/languages/${language}/categories`}
          className="inline-flex items-center gap-2 text-neon-cyan hover:text-neon-cyan/80 font-mono transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Categories
        </Link>
        <Link
          to={`/learn/${language}/${category}`}
          className="px-4 py-2 bg-neon-purple text-white font-display font-semibold rounded-lg hover:bg-neon-purple/90 transition-colors"
        >
          Learn {category} →
        </Link>
      </div>

      <h1 className="text-4xl font-display font-bold text-white mb-8 capitalize">
        {category?.replace(/-/g, ' ')} Challenges
      </h1>

      <div className="space-y-8">
        {tasks.map(task => (
          <div key={task._id} className="bg-dark-800 border-2 border-dark-700 rounded-lg p-6">
            {/* Task header */}
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleExpand(task._id)}
            >
              <h2 className="text-2xl font-display font-bold text-white hover:text-neon-cyan transition-colors">
                {task.title}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                  DIFFICULTY_BG[task.difficulty]
                } ${DIFFICULTY_COLORS[task.difficulty]}`}
              >
                {task.difficulty.toUpperCase()}
              </span>
            </div>

            {/* Short description */}
            <p className="text-gray-400 font-mono text-sm mt-2">
              {task.description.length > 150
                ? task.description.substring(0, 150) + '...'
                : task.description}
            </p>

            {/* Expandable full description */}
            {expandedTaskId === task._id && (
              <div className="mt-4 p-4 bg-dark-700 rounded-lg prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* GitHub integration */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Your GitHub username
                </label>
                <input
                  type="text"
                  value={githubUsernames[task._id] || ''}
                  onChange={(e) => handleGithubUsernameChange(task._id, e.target.value)}
                  placeholder="your-github-username"
                  className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-purple focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 font-mono mt-1">
                  Your solution must be in the repository <code>code-challenge-platform</code> at{' '}
                  <code>{task.configs[0].language}/{task.category}/{task.configs[0].entryPoint}</code>
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => handleRunTests(task)}
                isLoading={runningTaskId === task._id}
                disabled={!githubUsernames[task._id]?.trim()}
              >
                {runningTaskId === task._id ? 'Testing...' : '🧪 Test from GitHub'}
              </Button>

              {/* Test results */}
              {results[task._id] && (
                <div
                  className={`mt-4 p-4 rounded-lg border-2 ${
                    results[task._id]?.success
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-red-500/10 border-red-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{results[task._id]?.success ? '✅' : '❌'}</span>
                    <span
                      className={`font-mono font-bold ${
                        results[task._id]?.success ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {results[task._id]?.success ? 'All Tests Passed!' : 'Tests Failed'}
                    </span>
                  </div>
                  {results[task._id]?.stdout && (
                    <pre className="bg-dark-900 p-3 rounded text-sm font-mono text-green-400 overflow-x-auto">
                      {results[task._id]?.stdout}
                    </pre>
                  )}
                  {results[task._id]?.stderr && (
                    <pre className="bg-dark-900 p-3 rounded text-sm font-mono text-red-400 overflow-x-auto mt-2">
                      {results[task._id]?.stderr}
                    </pre>
                  )}
                  <p className="text-xs text-gray-500 font-mono mt-2">
                    Execution time: {results[task._id]?.executionTime}ms
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
