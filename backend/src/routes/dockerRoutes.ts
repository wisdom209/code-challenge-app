// routes/dockerRoutes.ts
import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import dockerService from '../services/dockerService';

const router = Router();

/**
 * GET /api/docker/health
 * Check Docker connection status
 * Public endpoint (no auth needed)
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isConnected = await dockerService.checkConnection();
    const info = isConnected ? await dockerService.getDockerInfo() : null;
    
    res.status(200).json({
      success: true,
      connected: isConnected,
      timestamp: new Date().toISOString(),
      info: info || { message: 'Docker not available' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check Docker health'
    });
  }
});

/**
 * POST /api/docker/run-inline
 * Execute inline code in a container (for testing/debugging)
 * Protected endpoint (requires auth)
 * 
 * NOTE: This is for running arbitrary code snippets, NOT for task submissions
 */
router.post('/run-inline', requireAuth, async (req: Request, res: Response) => {
  try {
    const { language, code, input, timeout } = req.body;

    // Validate input
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required'
      });
    }

    // Check if language is supported
    if (!dockerService.isLanguageSupported(language)) {
      return res.status(400).json({
        success: false,
        error: `Language "${language}" is not supported`,
        supportedLanguages: dockerService.getSupportedLanguages()
      });
    }

    // Validate code length (prevent abuse)
    if (code.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Code too long (max 10,000 characters)'
      });
    }

    // Run the code in Docker
    const result = await dockerService.runCode(
      language,
      code,
      input || '',
      timeout || 10000
    );

    // Return the result
    res.status(200).json({
      success: result.success,
      language,
      execution: {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        executionTime: result.executionTime,
        timedOut: result.timedOut
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Docker execution error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to execute code',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/docker/languages
 * Get list of supported languages
 * Public endpoint
 */
router.get('/languages', (req: Request, res: Response) => {
  const languages = dockerService.getSupportedLanguages().map(lang => {
    const names: Record<string, string> = {
      python: 'Python',
      c: 'C'
    };
    
    return {
      id: lang,
      name: names[lang] || lang,
      // Get actual image name from config
      image: dockerService.languageConfigs[lang]?.image || 'Unknown'
    };
  });

  res.status(200).json({
    success: true,
    languages
  });
});

/**
 * GET /api/docker/test
 * Simple test to verify Docker is working
 * Protected endpoint
 */
router.get('/test', requireAuth, async (req: Request, res: Response) => {
  try {
    // Test Docker connection
    const isConnected = await dockerService.checkConnection();
    
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: 'Docker is not available',
        message: 'Please make sure Docker is running on your system'
      });
    }

    // Test Python execution
    const pythonResult = await dockerService.runCode(
      'python',
      'print("Hello from Docker! Python test successful.")',
      '',
      5000
    );

    // Test C execution
    const cCode = `#include <stdio.h>\nint main() { printf("Hello from C! C test successful."); return 0; }`;
    const cResult = await dockerService.runCode('c', cCode, '', 5000);

    res.status(200).json({
      success: true,
      message: 'Docker integration test completed',
      tests: {
        docker: { connected: true },
        python: {
          success: pythonResult.success,
          output: pythonResult.stdout.trim(),
          error: pythonResult.stderr
        },
        c: {
          success: cResult.success,
          output: cResult.stdout.trim(),
          error: cResult.stderr
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Docker test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Removed the deprecated /run-from-repo endpoint - use /api/run instead

export default router;
