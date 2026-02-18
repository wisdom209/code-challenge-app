import { Request, Response, Router } from 'express';
import { requireAdmin } from '../../middleware/adminMiddleware';
import Task from '../../models/Task';
import { ITestCase } from '../../models/Task';

const router = Router();

/**
 * POST /api/admin/tasks/generate-test-script
 * Generate test script from test cases
 */
router.post(
  '/tasks/generate-test-script',
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { language, entryPoint, testCases, functionName } = req.body;

      if (!language || !entryPoint || !testCases) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: language, entryPoint, testCases',
        });
      }

      let testScript: string;
      let filename: string;

      if (language === 'python') {
        testScript = generatePythonTestScript(testCases, entryPoint, functionName);
        filename = 'test_solution.py';
      } else if (language === 'c') {
        testScript = generateCTestScript(testCases, entryPoint, functionName);
        filename = 'test_solution.sh';
      } else {
        return res.status(400).json({
          success: false,
          error: `Unsupported language: ${language}`,
        });
      }

      res.status(200).json({
        success: true,
        data: {
          script: testScript,
          filename,
          language,
        },
      });
    } catch (error: any) {
      console.error('Generate test script error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate test script',
      });
    }
  }
);

/**
 * POST /api/admin/tasks/validate
 * Validate task data before creation/update
 */
router.post(
  '/tasks/validate',
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const taskData = req.body;

      const errors: string[] = [];

      // Validate required fields
      if (!taskData.title || taskData.title.length < 3) {
        errors.push('Title must be at least 3 characters');
      }

      if (!taskData.description || taskData.description.length < 10) {
        errors.push('Description must be at least 10 characters');
      }

      if (!taskData.configs || taskData.configs.length === 0) {
        errors.push('At least one language configuration is required');
      }

      // Validate each config
      taskData.configs?.forEach((config: any, index: number) => {
        if (!config.language) {
          errors.push(`Config ${index + 1}: Language is required`);
        }
        if (!config.entryPoint) {
          errors.push(`Config ${index + 1}: Entry point is required`);
        }
        if (!config.testCommand) {
          errors.push(`Config ${index + 1}: Test command is required`);
        }
        if (!config.testScriptPath) {
          errors.push(`Config ${index + 1}: Test script path is required`);
        }
        if (!config.testCases || config.testCases.length === 0) {
          errors.push(
            `Config ${index + 1}: At least one test case is required`
          );
        }
      });

      res.status(200).json({
        success: true,
        isValid: errors.length === 0,
        errors,
      });
    } catch (error: any) {
      console.error('Validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate task',
      });
    }
  }
);

/**
 * GET /api/admin/tasks/stats
 * Get task statistics
 */
router.get(
  '/tasks/stats',
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const stats = await Task.aggregate([
        {
          $facet: {
            totalTasks: [{ $count: 'count' }],
            activeTasks: [{ $match: { isActive: true } }, { $count: 'count' }],
            byDifficulty: [
              { $group: { _id: '$difficulty', count: { $sum: 1 } } },
            ],
            byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
            byLanguage: [
              { $unwind: '$configs' },
              { $group: { _id: '$configs.language', count: { $sum: 1 } } },
            ],
            recentTasks: [
              { $sort: { createdAt: -1 } },
              { $limit: 10 },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  category: 1,
                  difficulty: 1,
                  createdAt: 1,
                },
              },
            ],
          },
        },
      ]);

      const result = stats[0];

      res.status(200).json({
        success: true,
        data: {
          totalTasks: result.totalTasks[0]?.count || 0,
          activeTasks: result.activeTasks[0]?.count || 0,
          byDifficulty: result.byDifficulty.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byCategory: result.byCategory.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byLanguage: result.byLanguage.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          recentTasks: result.recentTasks,
        },
      });
    } catch (error: any) {
      console.error('Admin stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      });
    }
  }
);

/**
 * POST /api/admin/tasks/bulk-delete
 * Bulk delete tasks
 */
router.post(
  '/tasks/bulk-delete',
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { taskIds } = req.body;

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid task IDs',
        });
      }

      await Task.updateMany({ _id: { $in: taskIds } }, { isActive: false });

      res.status(200).json({
        success: true,
        message: `Successfully deleted ${taskIds.length} tasks`,
      });
    } catch (error: any) {
      console.error('Admin bulk delete error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete tasks',
      });
    }
  }
);

/**
 * GET /api/admin/tasks
 * Get all tasks (admin view - includes hidden test cases)
 */
router.get('/tasks', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      difficulty,
      language,
      search,
    } = req.query;

    const filter: any = {};

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (language) filter['configs.language'] = language;
    if (search && typeof search === 'string') {
      filter.$text = { $search: search };
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean(); // Return plain objects

    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: tasks,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Admin get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
    });
  }
});

/**
 * POST /api/admin/tasks
 * Create new task
 */
router.post('/tasks', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      tags,
      points,
      order,
      estimatedTime,
      configs,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !difficulty || !configs) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Create new task
    const newTask = new Task({
      title,
      description,
      category,
      difficulty,
      tags: tags || [],
      points: points || 100,
      order: order || 0,
      estimatedTime: estimatedTime || 30,
      configs,
      isActive: true,
    });

    await newTask.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask,
    });
  } catch (error: any) {
    console.error('Admin create task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      details: error.message,
    });
  }
});

/**
 * GET /api/admin/tasks/:id
 * Get single task with full details (including hidden tests)
 */
router.get('/tasks/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error('Admin get task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
    });
  }
});

/**
 * PUT /api/admin/tasks/:id
 * Update existing task
 */
router.put('/tasks/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;

    const task = await Task.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error: any) {
    console.error('Admin update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/admin/tasks/:id
 * Delete task (soft delete)
 */
router.delete(
  '/tasks/:id',
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const task = await Task.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error: any) {
      console.error('Admin delete task error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete task',
      });
    }
  }
);

/**
 * POST /api/admin/tasks/:id/restore
 * Restore deleted task
 */
router.post(
  '/tasks/:id/restore',
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const task = await Task.findByIdAndUpdate(
        id,
        { isActive: true },
        { new: true }
      );

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Task restored successfully',
        data: task,
      });
    } catch (error: any) {
      console.error('Admin restore task error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to restore task',
      });
    }
  }
);

// ============= HELPER FUNCTIONS =============

private generatePythonTestScript(
  testCases: ITestCase[],
  entryPoint: string,
  functionName?: string
): string {
  // Determine the final function name
  let finalFuncName = functionName || entryPoint.replace('.py', '');

  // If entryPoint contains a path separator, extract just the filename
  if (finalFuncName.includes('/') || finalFuncName.includes('\\')) {
    finalFuncName = finalFuncName.split(/[\/\\]/).pop() || finalFuncName;
  }

  // If entryPoint contains a dot for module.function syntax, extract the function name
  if (finalFuncName.includes('.')) {
    finalFuncName = finalFuncName.split('.').pop() || finalFuncName;
  }

  const lines: string[] = [
    '#!/usr/bin/env python3',
    'import sys',
    'import traceback',
    '',
    'try:',
    `    from ${finalFuncName} import ${finalFuncName}`,
    'except ImportError:',
    '    try:',
    `        import ${finalFuncName}`,
    `        ${finalFuncName} = getattr(${finalFuncName}, '${finalFuncName}')`,
    '    except ImportError:',
    `        print(f"FAIL: Could not import function '${finalFuncName}'")`,
    '        sys.exit(1)',
    'except Exception as e:',
    '    print(f"FAIL: {e}")',
    '    sys.exit(1)',
    '',
    'tests = [',
  ];

  testCases.forEach((tc, idx) => {
    const inputStr = JSON.stringify(tc.input);
    const expectedStr = JSON.stringify(tc.expectedOutput);
    const desc = tc.description || `Test ${idx + 1}`;
    lines.push(`    (${inputStr}, ${expectedStr}, "${desc}"),`);
  });

  lines.push(']', '');
  lines.push('passed = failed = 0');
  lines.push('for inp, exp, desc in tests:');
  lines.push('    try:');
  lines.push(`        res = ${finalFuncName}(inp)`);
  lines.push('        if res == exp:');
  lines.push('            print(f"✅ {desc}")');
  lines.push('            passed += 1');
  lines.push('        else:');
  lines.push(
    '            print(f"❌ {desc}: expected {repr(exp)}, got {repr(res)}")'
  );
  lines.push('            failed += 1');
  lines.push('    except Exception as e:');
  lines.push('        print(f"❌ {desc}: {e}")');
  lines.push('        traceback.print_exc()');
  lines.push('        failed += 1');
  lines.push('');
  lines.push('print(f"\\nResults: {passed} passed, {failed} failed")');
  lines.push('sys.exit(0 if failed == 0 else 1)');

  return lines.join('\n');
}

function generateCTestScript(
  testCases: ITestCase[],
  entryPoint: string,
  functionName: string
): string {
  const lines: string[] = [
    '#!/bin/bash',
    '',
    `gcc ${entryPoint} -o /tmp/test_solution 2>&1`,
    'if [ $? -ne 0 ]; then',
    '  echo "FAIL: Compilation failed"',
    '  exit 1',
    'fi',
    '',
    'run_test() {',
    '  INPUT="$1"',
    '  EXPECTED="$2"',
    '  DESC="$3"',
    '  ',
    '  OUTPUT=$(echo -n "$INPUT" | /tmp/test_solution 2>&1)',
    '  EXIT_CODE=$?',
    '  ',
    '  # Special case: empty input expects empty output AND allows any exit code',
    '  if [ "$INPUT" = "" ] && [ "$OUTPUT" = "" ]; then',
    '    echo "✅ $DESC"',
    '    return 0',
    '  fi',
    '  ',
    '  if [ $EXIT_CODE -eq 0 ] && [ "$OUTPUT" = "$EXPECTED" ]; then',
    '    echo "✅ $DESC"',
    '    return 0',
    '  else',
    '    echo "❌ $DESC"',
    '    echo "   Input: \'$INPUT\'"',
    '    echo "   Expected: \'$EXPECTED\'"',
    '    echo "   Got: \'$OUTPUT\'"',
    '    echo "   Exit Code: $EXIT_CODE"',
    '    return 1',
    '  fi',
    '}',
    '',
    'PASSED=0',
    'FAILED=0',
    '',
  ];

  testCases.forEach((tc, idx) => {
    const desc = tc.description || `Test ${idx + 1}`;
    const inputEscaped = tc.input.replace(/"/g, '\\"');
    const expectedEscaped = tc.expectedOutput.replace(/"/g, '\\"');
    lines.push(
      `run_test "${inputEscaped}" "${expectedEscaped}" "${desc}" && ((PASSED++)) || ((FAILED++))`
    );
  });

  lines.push('');
  lines.push('rm -f /tmp/test_solution');
  lines.push('');
  lines.push('echo ""');
  lines.push('echo "Results: $PASSED passed, $FAILED failed"');
  lines.push('');
  lines.push('if [ "$FAILED" -eq 0 ]; then');
  lines.push('  echo "🎉 All tests passed!"');
  lines.push('  exit 0');
  lines.push('else');
  lines.push('  echo "⚠️  $FAILED test(s) failed"');
  lines.push('  exit 1');
  lines.push('fi');

  return lines.join('\n');
}

export default router;
