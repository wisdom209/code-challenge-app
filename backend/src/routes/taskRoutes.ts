import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import Task from '../models/Task';

const router = Router();

/**
 * GET /api/tasks/categories
 * Get list of all task categories
 * Public endpoint
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await Task.distinct('category', { isActive: true });

    res.status(200).json({	
      success: true,
      data: categories.sort(),
    });
  } catch (error: any) {
    console.error('Get categories error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});


/**
 * GET /api/tasks/stats
 * Get task statistics
 * Public endpoint
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await Task.aggregate([
      { $match: { isActive: true } },
      {
        $facet: {
          totalTasks: [{ $count: 'count' }],
          byDifficulty: [
            { $group: { _id: '$difficulty', count: { $sum: 1 } } },
          ],
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
          totalPoints: [{ $group: { _id: null, total: { $sum: '$points' } } }],
          languages: [
            { $unwind: '$configs' },
            { $group: { _id: '$configs.language', count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const result = stats[0];

    res.status(200).json({
      success: true,
      data: {
        totalTasks: result.totalTasks[0]?.count || 0,
        byDifficulty: result.byDifficulty.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byCategory: result.byCategory.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalPoints: result.totalPoints[0]?.total || 0,
        languages: result.languages.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error: any) {
    console.error('Get stats error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});


/**
 * GET /api/tasks
 * Get all tasks (with optional filtering)
 * Public endpoint - no authentication required
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      difficulty,
      language,
      search,
      limit = 50,
      skip = 0,
    } = req.query;

    // Build filter query
    const filter: any = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (language) {
      filter['configs.language'] = (language as string).toLowerCase();
    }

    if (search && typeof search === 'string') {
      filter.$text = { $search: search };
    }

    // Execute query with pagination
    const tasks = await Task.find(filter)
      .select('-configs.testCases -configs.files') // Don't include test details
      .sort({ order: 1, createdAt: -1 })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 100)); // Max 100 per request

    // Get total count for pagination
    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: tasks,
      meta: {
        total,
        returned: tasks.length,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: total > Number(skip) + tasks.length,
      },
    });
  } catch (error: any) {
    console.error('Get tasks error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      message: error.message,
    });
  }
});

/**
 * GET /api/tasks/:id/config/:language
 * Get task configuration for a specific language
 * Protected endpoint - requires authentication
 */
router.get(
  '/:id/config/:language',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id, language } = req.params;

      const task = await Task.findOne({ _id: id, isActive: true });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      const config = (task as any).getConfigForLanguage(language);

      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Language not supported',
          message: `This task does not support ${language}`,
          supportedLanguages: task.configs.map((c: any) => c.language),
        });
      }

      // Return full configuration (including hidden tests for authorized users)
      res.status(200).json({
        success: true,
        data: {
          taskId: task._id,
          title: task.title,
          language: config.language,
          entryPoint: config.entryPoint,
          testCommand: config.testCommand,
          timeout: config.timeout,
          files: config.files,
          // Include all test cases for running tests
          testCases: config.testCases,
        },
      });
    } catch (error: any) {
      console.error('Get task config error:', error);

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid task ID',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch task configuration',
        message: error.message,
      });
    }
  }
);


/**
 * GET /api/tasks/:id
 * Get a specific task by ID
 * Public endpoint - no authentication required
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({ _id: id, isActive: true });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'The requested task does not exist or is inactive',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error('Get task error:', error);

    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID',
        message: 'The provided task ID is not valid',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
      message: error.message,
    });
  }
});


/**
 * GET /api/tasks/languages
 * Get list of all supported languages across tasks
 * Public endpoint
 */
router.get('/:language', async (req, res) => {
  const { language } = req.params;
  const tasks = await Task.find({
    'configs.language': language.toLowerCase(),
    isActive: true,
  });
  res.json(tasks);
});

// router.get('/languages', async (req: Request, res: Response) => {
//   try {
//     const languages = await Task.aggregate([
//       { $match: { isActive: true } },
//       { $unwind: '$configs' },
//       { $group: { _id: '$configs.language' } },
//       { $sort: { _id: 1 } },
//     ]);

//     res.status(200).json({
//       success: true,
//       data: languages.map((item) => item._id),
//     });
//   } catch (error: any) {
//     console.error('Get languages error:', error);

//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch languages',
//     });
//   }
// });


export default router;
