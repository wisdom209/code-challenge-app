import React, { useState } from 'react';
import { AdminTask, AdminTestCase } from '../../types/index';
import { Button } from '../shared/Button';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import { TestScriptEditor } from './TestScriptEditor';

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

  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [showScriptPreview, setShowScriptPreview] = useState<boolean>(false);
  const [showScriptEditor, setShowScriptEditor] = useState<boolean>(false);
  const [previewConfigIndex, setPreviewConfigIndex] = useState<number>(0);
  const [editorConfigIndex, setEditorConfigIndex] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addTestCase = (configIndex: number) => {
    const newConfigs = [...configs];
    newConfigs[configIndex].testCases.push({
      input: '',
      expectedOutput: '',
      isHidden: false,
      description: '',
    });
    setConfigs(newConfigs);
  };

  const removeTestCase = (configIndex: number, testIndex: number) => {
    const newConfigs = [...configs];
    newConfigs[configIndex].testCases.splice(testIndex, 1);
    setConfigs(newConfigs);
  };

  const updateTestCase = (
    configIndex: number,
    testIndex: number,
    field: keyof AdminTestCase,
    value: string | boolean
  ) => {
    setConfigs((prevConfigs) => {
      const updatedConfigs = prevConfigs.map((config, idx) => {
        if (idx !== configIndex) return config;

        return {
          ...config,
          testCases: config.testCases.map((testCase, tIdx) =>
            tIdx === testIndex ? { ...testCase, [field]: value } : testCase
          ),
        };
      });
      return updatedConfigs;
    });
  };

  const generateTestScript = async (configIndex: number) => {
    try {
      const config = configs[configIndex];
      const response = await apiService.post('/admin/tasks/generate-test-script', {
        language: config.language,
        entryPoint: config.entryPoint,
        testCases: config.testCases,
      });

      if (response.success) {
        setGeneratedScript(response.data.script);
        setPreviewConfigIndex(configIndex);
        setShowScriptPreview(true);
      }
    } catch (error) {
      console.error('Failed to generate test script:', error);
      alert('Failed to generate test script');
    }
  };

  const openScriptEditor = (configIndex: number) => {
    setEditorConfigIndex(configIndex);
    setShowScriptEditor(true);
  };

  const saveEditedScript = (script: string) => {
    const newConfigs = [...configs];
    // We'll store the custom script in a new property
    newConfigs[editorConfigIndex] = {
      ...newConfigs[editorConfigIndex],
      customTestScript: script
    };
    setConfigs(newConfigs);
    setShowScriptEditor(false);
  };

  const validateTask = async () => {
    try {
      const taskData: Partial<AdminTask> = {
        ...formData,
        points: parseInt(formData.points),
        order: parseInt(formData.order),
        estimatedTime: parseInt(formData.estimatedTime),
        tags: formData.tags
          .split(',')
          .map((t: any) => t.trim())
          .filter((t: any) => t),
        configs: configs.map((config: any) => ({
          ...config,
          timeout: parseInt(config.timeout),
          memoryLimit: parseInt(config.memoryLimit),
        })),
      };

      const response = await apiService.post('/admin/tasks/validate', taskData);

      if (response.success) {
        setValidationErrors(response.errors || []);
        if (response.isValid) {
          alert('✅ Task validation passed! Ready to create/update.');
        } else {
          alert('❌ Validation failed. Please check the errors.');
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert('Failed to validate task');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskData: Partial<AdminTask> = {
      ...formData,
      points: parseInt(formData.points),
      order: parseInt(formData.order),
      estimatedTime: parseInt(formData.estimatedTime),
      tags: formData.tags
        .split(',')
        .map((t: any) => t.trim())
        .filter((t: any) => t),
      configs: configs.map((config: any) => {
        // Create a new config object without the customTestScript property
        const { customTestScript, ...cleanConfig } = config;
        
        // If we have a custom test script, we might want to save it separately
        // For now, we'll just keep the clean config
        return {
          ...cleanConfig,
          timeout: parseInt(config.timeout),
          memoryLimit: parseInt(config.memoryLimit),
        };
      }),
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

  const copyTestScriptToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    alert('Test script copied to clipboard!');
  };

  const downloadTestScript = () => {
    const config = configs[previewConfigIndex];
    const filename = config.language === 'python' ? 'test_solution.py' : 'test_solution.sh';
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-4">
            <h3 className="text-lg font-display font-bold text-red-400 mb-2">
              ⚠️ Validation Errors
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx} className="text-red-300 font-mono text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

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
                    {diff.toUpperCase()}
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
          </div>
          <div className="mt-4">
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
              placeholder="beginner, loops, arrays"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Description (Markdown) *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
              rows={10}
              required
              placeholder="Write task description in Markdown format..."
            />
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm font-mono text-gray-300">
                Active (visible to users)
              </span>
            </label>
          </div>
        </div>

        {/* Language Configurations */}
        <div className="bg-dark-800 border-2 border-dark-600 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-bold text-white">
              Language Configurations
            </h3>
            <Button type="button" variant="secondary" onClick={addConfig}>
              + Add Language
            </Button>
          </div>

          {configs.map((config: any, index: any) => (
            <div key={index} className="mb-6 p-4 bg-dark-700 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display font-bold text-white">
                  Configuration {index + 1} - {config.language.toUpperCase()}
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => generateTestScript(index)}
                    className="px-3 py-1 bg-neon-cyan/20 border border-neon-cyan rounded text-neon-cyan font-mono text-sm hover:bg-neon-cyan/30 transition-colors"
                  >
                    🔧 Generate Script
                  </button>
                  <button
                    type="button"
                    onClick={() => openScriptEditor(index)}
                    className="px-3 py-1 bg-neon-purple/20 border border-neon-purple rounded text-neon-purple font-mono text-sm hover:bg-neon-purple/30 transition-colors"
                  >
                    ✏️ Edit Script
                  </button>
                  {configs.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfigs(configs.filter((_: any, i: any) => i !== index))
                      }
                      className="text-neon-pink hover:text-neon-pink/80 font-mono text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
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
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={config.timeout}
                    onChange={(e) => {
                      const newConfigs = [...configs];
                      newConfigs[index] = {
                        ...newConfigs[index],
                        timeout: parseInt(e.target.value),
                      };
                      setConfigs(newConfigs);
                    }}
                    className="w-full px-4 py-3 bg-dark-600 border-2 border-dark-500 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">
                    Memory Limit (MB)
                  </label>
                  <input
                    type="number"
                    value={config.memoryLimit}
                    onChange={(e) => {
                      const newConfigs = [...configs];
                      newConfigs[index] = {
                        ...newConfigs[index],
                        memoryLimit: parseInt(e.target.value),
                      };
                      setConfigs(newConfigs);
                    }}
                    className="w-full px-4 py-3 bg-dark-600 border-2 border-dark-500 rounded-lg text-white font-mono focus:border-neon-cyan focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-display font-bold text-white mb-3">
                  Test Cases
                </h4>
                {config.testCases.map((testCase: any, testIdx: any) => (
                  <div
                    key={testIdx}
                    className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 p-3 bg-dark-600 rounded"
                  >
                    <div className="col-span-1">
                      <label className="block text-xs font-mono text-gray-400 mb-1">
                        Input
                      </label>
                      <textarea
                        value={testCase.input}
                        onChange={(e) =>
                          updateTestCase(index, testIdx, 'input', e.target.value)
                        }
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded text-white font-mono text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-mono text-gray-400 mb-1">
                        Expected Output
                      </label>
                      <textarea
                        value={testCase.expectedOutput}
                        onChange={(e) =>
                          updateTestCase(
                            index,
                            testIdx,
                            'expectedOutput',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded text-white font-mono text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-mono text-gray-400 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={testCase.description || ''}
                        onChange={(e) =>
                          updateTestCase(
                            index,
                            testIdx,
                            'description',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded text-white font-mono text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex items-center">
                      <label className="flex items-center gap-2 text-sm font-mono text-gray-300">
                        <input
                          type="checkbox"
                          checked={testCase.isHidden}
                          onChange={(e) =>
                            updateTestCase(
                              index,
                              testIdx,
                              'isHidden',
                              e.target.checked
                            )
                          }
                          className="w-4 h-4"
                        />
                        Hidden
                      </label>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => removeTestCase(index, testIdx)}
                        className="text-neon-pink hover:text-neon-pink/80 font-mono text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addTestCase(index)}
                  className="mt-2 px-4 py-2 bg-dark-600 border border-neon-cyan/50 rounded text-neon-cyan font-mono text-sm hover:bg-dark-500 transition-colors"
                >
                  + Add Test Case
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
          >
            {initialData ? 'Update Task' : 'Create Task'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={validateTask}
          >
            🔍 Validate
          </Button>
          <Link to="/admin/tasks">
            <Button type="button" variant="secondary" size="lg">
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      {/* Test Script Preview Modal */}
      {showScriptPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border-2 border-neon-cyan rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-display font-bold text-neon-cyan">
                  Generated Test Script
                </h3>
                <button
                  onClick={() => setShowScriptPreview(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="bg-dark-900 p-4 rounded-lg mb-4">
                <pre className="text-green-400 font-mono text-sm overflow-x-auto whitespace-pre">
                  {generatedScript}
                </pre>
              </div>
              <div className="flex gap-4">
                <Button onClick={copyTestScriptToClipboard} variant="primary">
                  📋 Copy to Clipboard
                </Button>
                <Button onClick={downloadTestScript} variant="secondary">
                  💾 Download Script
                </Button>
                <Button
                  onClick={() => setShowScriptPreview(false)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Script Editor Modal */}
      {showScriptEditor && (
        <TestScriptEditor
          language={configs[editorConfigIndex]?.language || 'python'}
          initialScript={configs[editorConfigIndex]?.customTestScript || generatedScript || ''}
          onSave={saveEditedScript}
          onCancel={() => setShowScriptEditor(false)}
        />
      )}
    </>
  );
};

