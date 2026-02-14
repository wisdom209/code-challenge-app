import React, { useEffect, useState } from 'react';
import {  AdminTask } from '../../types/index';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { Button } from '../../components/shared/Button';
import { Link } from 'react-router-dom';
import { DIFFICULTY_COLORS, DIFFICULTY_BG } from '../../utils/constants';
import { adminApiService } from '@/services/adminApi';

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    language: '',
    search: '',
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const response = await adminApiService.getAllTasks(filters);
        setTasks(response.data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [filters]);

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedTasks.length} tasks?`)) return;

    try {
      await adminApiService.bulkDelete(selectedTasks);
      setTasks(tasks.filter(t => !selectedTasks.includes(t._id as string)));
      setSelectedTasks([]);
    } catch (error) {
      alert('Failed to delete tasks');
    }
  };

  const toggleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(t => t._id as string));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-dark-800 border-2 border-dark-600 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 bg-dark-700 border-2 border-dark-600 rounded text-white font-mono focus:border-neon-cyan focus:outline-none"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 bg-dark-700 border-2 border-dark-600 rounded text-white font-mono focus:border-neon-cyan focus:outline-none"
          >
            <option value="">All Categories</option>
            {[...new Set(tasks.map(t => t.category))].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="px-4 py-2 bg-dark-700 border-2 border-dark-600 rounded text-white font-mono focus:border-neon-cyan focus:outline-none"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={filters.language}
            onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            className="px-4 py-2 bg-dark-700 border-2 border-dark-600 rounded text-white font-mono focus:border-neon-cyan focus:outline-none"
          >
            <option value="">All Languages</option>
            {[...new Set(tasks.flatMap(t => t.configs.map(c => c.language)))].map(lang => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="bg-neon-purple/10 border-2 border-neon-purple/50 rounded-lg p-4 flex items-center justify-between">
          <span className="text-neon-purple font-mono">
            {selectedTasks.length} tasks selected
          </span>
          <Button variant="danger" onClick={handleBulkDelete}>
            Delete Selected
          </Button>
        </div>
      )}

      {/* Tasks Table */}
      <div className="bg-dark-800 border-2 border-dark-600 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedTasks.length === tasks.length && tasks.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-4 py-3 text-left font-display font-bold text-white">
                Title
              </th>
              <th className="px-4 py-3 text-left font-display font-bold text-white">
                Category
              </th>
              <th className="px-4 py-3 text-left font-display font-bold text-white">
                Difficulty
              </th>
              <th className="px-4 py-3 text-left font-display font-bold text-white">
                Language
              </th>
              <th className="px-4 py-3 text-left font-display font-bold text-white">
                Status
              </th>
              <th className="px-4 py-3 text-right font-display font-bold text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task._id}
                className="border-t border-dark-600 hover:bg-dark-700/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task._id as string)}
                    onChange={() => handleSelectTask(task._id as string)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-4 py-3 font-mono text-white">{task.title}</td>
                <td className="px-4 py-3 font-mono text-gray-400 capitalize">
                  {task.category}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                      DIFFICULTY_BG[task.difficulty]
                    } ${DIFFICULTY_COLORS[task.difficulty]}`}
                  >
                    {task.difficulty.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-neon-cyan">
                  {task.configs[0].language.toUpperCase()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${
                      task.isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    {task.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/admin/tasks/edit/${task._id}`}
                      className="text-neon-cyan hover:text-neon-cyan/80 font-mono text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={async () => {
                        if (window.confirm('Delete this task?')) {
                          await adminApiService.deleteTask(task._id as string);
                          setTasks(tasks.filter(t => t._id !== task._id));
                        }
                      }}
                      className="text-neon-pink hover:text-neon-pink/80 font-mono text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-display font-bold text-gray-400 mb-2">
            No tasks found
          </h3>
          <p className="text-gray-500 font-mono">
            Try adjusting your filters or create a new task
          </p>
        </div>
      )}
    </div>
  );
};

