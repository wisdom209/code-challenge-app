import React, { useState } from 'react';
import { AdminTask } from '../../types/index';
import { Button } from '../../components/shared/Button';
import { Link } from 'react-router-dom';

interface TaskFormProps {
  initialData?: Partial<AdminTask>;
  onSubmit: (data: Partial<AdminTask>) => Promise<void>;
  isSubmitting?: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'strings',
    difficulty: initialData?.difficulty || 'easy',
    tags: initialData?.tags?.join(', ') || '',
    points: initialData?.points?.toString() || '100',
    order: initialData?.order?.toString() || '0',
    estimatedTime: initialData?.estimatedTime?.toString() || '30',
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  const [configs, setConfigs] = useState(
    initialData?.configs || [
      {
        language: 'python',
        entryPoint: 'solution.py',
        testCommand: 'python test_solution.py',
        timeout: 5000,
        memoryLimit: 128,
        testScriptPath: 'Python/strings/reverse_a_string',
        testCases: [
          {
            input: 'hello',
            expectedOutput: 'olleh',
            isHidden: false,
            description: 'Basic',
          },
        ],
      },
    ]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskData: Partial<AdminTask> = {
      ...formData,
      points: parseInt(formData.points),
      order: parseInt(formData.order),
      estimatedTime: parseInt(formData.estimatedTime),
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t),
      configs: configs.map((config) => ({
        ...config,
        timeout: config.timeout,
        memoryLimit: config.memoryLimit,
      })),
    };

    await onSubmit(taskData);
  };

  const addConfig = () => {
    setConfigs([
      ...configs,
      {
        language: 'c',
        entryPoint: 'solution.c',
        testCommand: 'bash test_solution.sh',
        timeout: 5000,
        memoryLimit: 128,
        testScriptPath: 'C/strings/reverse_a_string',
        testCases: [],
      },
    ]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-dark-800 border-2 border-dark-600 rounded-lg p-6">
        <h3 className="text-xl font-display font-bold text-white mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
              required
            >
              {[
                'strings',
                'arrays',
                'algorithms',
                'data-structures',
                'mathematics',
                'recursion',
                'sorting',
                'searching',
              ].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Difficulty *
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({ ...formData, difficulty: e.target.value as any })
              }
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
              required
            >
              {['easy', 'medium', 'hard'].map((diff) => (
                <option key={diff} value={diff}>
                  {diff.toUpperCase()} {/* Plain text only */}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Points
            </label>
            <input
              type="number"
              value={formData.points}
              onChange={(e) =>
                setFormData({ ...formData, points: e.target.value })
              }
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Order
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: e.target.value })
              }
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={formData.estimatedTime}
              onChange={(e) =>
                setFormData({ ...formData, estimatedTime: e.target.value })
              }
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
              placeholder="python, beginner, strings"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-mono text-gray-300"
            >
              Active
            </label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-dark-800 border-2 border-dark-600 rounded-lg p-6">
        <h3 className="text-xl font-display font-bold text-white mb-4">
          Description *
        </h3>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none min-h-[200px]"
          required
        />
      </div>

      {/* Language Configs */}
      <div className="bg-dark-800 border-2 border-dark-600 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-display font-bold text-white">
            Language Configurations
          </h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addConfig}
          >
            Add Language
          </Button>
        </div>

        {configs.map((config, index) => (
          <div key={index} className="mb-6 p-4 bg-dark-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-bold text-white">
                Configuration {index + 1}
              </h4>
              {configs.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setConfigs(configs.filter((_, i) => i !== index))
                  }
                  className="text-neon-pink hover:text-neon-pink/80 font-mono text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={config.language}
                  onChange={(e) => {
                    const newConfigs = [...configs];
                    newConfigs[index] = {
                      ...newConfigs[index],
                      language: e.target.value,
                    };
                    setConfigs(newConfigs);
                  }}
                  className="w-full px-4 py-3 bg-dark-600 border-2 border-dark-500 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
                >
                  {['python', 'c', 'javascript', 'java', 'cpp'].map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Entry Point
                </label>
                <input
                  type="text"
                  value={config.entryPoint}
                  onChange={(e) => {
                    const newConfigs = [...configs];
                    newConfigs[index] = {
                      ...newConfigs[index],
                      entryPoint: e.target.value,
                    };
                    setConfigs(newConfigs);
                  }}
                  className="w-full px-4 py-3 bg-dark-600 border-2 border-dark-500 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Test Command
                </label>
                <input
                  type="text"
                  value={config.testCommand}
                  onChange={(e) => {
                    const newConfigs = [...configs];
                    newConfigs[index] = {
                      ...newConfigs[index],
                      testCommand: e.target.value,
                    };
                    setConfigs(newConfigs);
                  }}
                  className="w-full px-4 py-3 bg-dark-600 border-2 border-dark-500 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Test Script Path
                </label>
                <input
                  type="text"
                  value={config.testScriptPath}
                  onChange={(e) => {
                    const newConfigs = [...configs];
                    newConfigs[index] = {
                      ...newConfigs[index],
                      testScriptPath: e.target.value,
                    };
                    setConfigs(newConfigs);
                  }}
                  className="w-full px-4 py-3 bg-dark-600 border-2 border-dark-500 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
                  placeholder="Python/strings/reverse_a_string"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
        >
          {initialData ? 'Update Task' : 'Create Task'}
        </Button>
        <Link to="/admin/tasks">
          <Button type="button" variant="secondary" size="lg">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
};

