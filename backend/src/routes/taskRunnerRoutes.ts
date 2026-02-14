// routes/taskRunnerRoutes.ts
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import dockerService from '../services/dockerService';
import User from '../models/User';

const router = Router();

/**
 * POST /api/run
 * Main task runner endpoint
 * Accepts task ID and runs user's code from GitHub
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { taskId, language, repoName } = req.body;

    // Get user from auth middleware
    const userId = (req as any).user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Validate inputs
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language is required',
      });
    }

    // Check if language is supported
    if (!dockerService.isLanguageSupported(language)) {
      return res.status(400).json({
        success: false,
        error: `Language "${language}" is not supported`,
        supportedLanguages: dockerService.getSupportedLanguages(),
      });
    }

    console.log(
      `🚀 User ${user.username} running task ${taskId} in ${language}`
    );

    // Run tests from the user's GitHub repository
    const result = await dockerService.runTestsFromRepo(
      user.username, // GitHub username
      taskId,
      language,
      repoName // Optional custom repo name (from deprecated endpoint)
    );

    // Return the execution result
    res.status(200).json({
      success: result.success,
      taskId,
      language,
      githubUsername: user.username,
      execution: {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        executionTime: result.executionTime,
        timedOut: result.timedOut,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Task runner error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to run task',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
