import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Task, ExecutionResult } from '../types';
import { Button } from '../components/shared/Button';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { DIFFICULTY_COLORS, DIFFICULTY_BG } from '../utils/constants';
import { useAuth } from '@/context/AuthContext';

export const TaskDetails: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [githubUsername, setGithubUsername] = useState(user?.username || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningRepo, setIsRunningRepo] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState('');
  const [_, setActiveTab] = useState<'description' | 'results'>('description');

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const fetchedTask = await apiService.getTaskById(id);
        setTask(fetchedTask);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load task');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const handleRunFromRepo = async () => {
    if (!task || !id || !githubUsername.trim()) {
      alert('Please enter your GitHub username');
      return;
    }
    setIsRunningRepo(true);
    setResult(null);
    setActiveTab('results');
    try {
      const testResult = await apiService.runTestsFromRepo({
        taskId: id,
        githubUsername: githubUsername.trim(),
        language: task.configs[0].language,
      });
      setResult(testResult);
    } catch (err: any) {
      setResult({
        success: false,
        exitCode: -1,
        stdout: '',
        stderr:
          err.response?.data?.message || 'Failed to run tests from repository',
        executionTime: 0,
        timedOut: false,
      });
    } finally {
      setIsRunningRepo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="text-center py-12">
        <div className="text-neon-pink text-xl font-mono mb-4">
          ⚠️ {error || 'Task not found'}
        </div>
        <Link
          to="/languages"
          className="text-neon-cyan hover:underline font-mono"
        >
          ← Back to languages
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/languages/${task.configs[0].language}/${task.category}`}
          className="inline-flex items-center gap-2 text-neon-cyan hover:text-neon-cyan/80 font-mono mb-6 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to {task.category}
        </Link>

        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-3">
              {task.title}
            </h1>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                  DIFFICULTY_BG[task.difficulty]
                } ${DIFFICULTY_COLORS[task.difficulty]}`}
              >
                {task.difficulty.toUpperCase()}
              </span>
              <span className="text-gray-400 font-mono text-sm">
                {task.configs[0].language.toUpperCase()}
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 font-mono text-sm capitalize">
                {task.category.replace(/-/g, ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Description */}
        <div className="bg-dark-800 border-2 border-dark-700 rounded-lg p-6">
          <h2 className="text-2xl font-display font-bold text-white mb-4">
            Description
          </h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        </div>

        {/* Starter Code */}
        {task.starterCode && (
          <div className="bg-dark-800 border-2 border-dark-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-display font-bold text-white">
                Starter Code
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(task.starterCode)}
              >
                Copy to Clipboard
              </Button>
            </div>
            <pre className="bg-dark-900 border border-dark-600 rounded p-4 overflow-x-auto text-sm font-mono text-gray-300">
              {task.starterCode}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-dark-800 border-2 border-dark-700 rounded-lg p-6">
          <h2 className="text-2xl font-display font-bold text-white mb-4">
            How to Complete This Task
          </h2>
          <ol className="space-y-4 text-gray-300 font-mono text-sm">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-neon-cyan/20 text-neon-cyan rounded-full flex items-center justify-center font-bold mt-1">
                1
              </span>
              <span>
                Clone your GitHub repository locally:
                <pre className="bg-dark-900 border border-dark-600 rounded p-3 mt-2 text-xs">
                  git clone https://github.com/
                  {githubUsername || 'YOUR_USERNAME'}
                  /code-challenge-platform.git
                </pre>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-neon-cyan/20 text-neon-cyan rounded-full flex items-center justify-center font-bold mt-1">
                2
              </span>
              <span>
                Create a solution file in the appropriate directory:
                <pre className="bg-dark-900 border border-dark-600 rounded p-3 mt-2 text-xs">
                  code-challenge-platform/{task.category}/
                  {task.configs[0].entryPoint}
                </pre>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-neon-cyan/20 text-neon-cyan rounded-full flex items-center justify-center font-bold mt-1">
                3
              </span>
              <span>Write your solution code and test it locally</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-neon-cyan/20 text-neon-cyan rounded-full flex items-center justify-center font-bold mt-1">
                4
              </span>
              <span>
                Commit and push your solution:
                <pre className="bg-dark-900 border border-dark-600 rounded p-3 mt-2 text-xs">
                  git add .
                  <br />
                  git commit -m "Solve {task.title}"
                  <br />
                  git push origin main
                </pre>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-neon-cyan/20 text-neon-cyan rounded-full flex items-center justify-center font-bold mt-1">
                5
              </span>
              <span>Use the form below to test your solution from GitHub</span>
            </li>
          </ol>
        </div>

        {/* GitHub Integration */}
        <div className="bg-dark-800 border-2 border-dark-700 rounded-lg p-6">
          <h2 className="text-2xl font-display font-bold text-white mb-4">
            Test Your Solution
          </h2>
          <p className="text-gray-400 font-mono text-sm mb-6">
            Enter your GitHub username to test your solution from your
            repository
          </p>

          <div className="space-y-4">
            {/* Results */}
            {result && (
              <div className="mt-6 pt-6 border-t border-dark-600">
                <h3 className="text-xl font-display font-bold text-white mb-4">
                  Test Results
                </h3>
                <div
                  className={`p-4 rounded-lg border-2 ${
                    result.success
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-red-500/10 border-red-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">
                      {result.success ? '✅' : '❌'}
                    </span>
                    <span
                      className={`font-mono font-bold text-lg ${
                        result.success ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {result.success ? 'All Tests Passed!' : 'Tests Failed'}
                    </span>
                  </div>
                  <div className="text-sm font-mono text-gray-400 mb-4">
                    Execution time: {result.executionTime}ms
                    {result.timedOut && ' (TIMED OUT)'}
                  </div>
                  {(result.stdout || result.stderr) && (
                    <pre className="bg-dark-900 border border-dark-600 rounded p-4 overflow-x-auto text-sm font-mono max-h-64 overflow-y-auto">
                      {result.stdout}
                      {result.stderr && (
                        <span className="text-red-400">{result.stderr}</span>
                      )}
                    </pre>
                  )}
                </div>
              </div>
            )}
			
            <div>
              <label className="block text-sm font-mono text-gray-300 mb-2">
                GitHub Username
              </label>
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="your-github-username"
                className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-purple focus:outline-none transition-colors"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleRunFromRepo}
              isLoading={isRunningRepo}
              disabled={!githubUsername.trim()}
            >
              {isRunningRepo ? 'Testing...' : '🧪 Test from GitHub'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

