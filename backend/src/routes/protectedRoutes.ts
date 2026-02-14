import { Request, Response, Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware';

const router = Router();

/**
 * GET /api/protected/public
 * Public route - anyone can access
 */
router.get('/public', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'This is a public route',
    timestamp: new Date().toISOString(),
    note: 'No authentication required',
  });
});

/**
 * GET /api/protected/optional
 * Optional authentication - works with or without being logged in
 */
router.get('/optional', optionalAuth, (req: Request, res: Response) => {
  const isLoggedIn = !!req.user;
  
  res.status(200).json({
    success: true,
    message: isLoggedIn 
      ? `Hello ${req.user!.username}! You are logged in`
      : 'Hello guest! You are not logged in',
    isAuthenticated: isLoggedIn,
    user: isLoggedIn ? {
      id: req.user!._id,
      username: req.user!.username,
    } : null,
  });
});

/**
 * GET /api/protected/required
 * Protected route - MUST be logged in
 */
router.get('/required', requireAuth, (req: Request, res: Response) => {
  // By this point, requireAuth has verified the token
  // and attached the user to req.user
  
  res.status(200).json({
    success: true,
    message: `Welcome ${req.user!.username}!`,
    user: {
      id: req.user!._id,
      username: req.user!.username,
    },
    accessedAt: new Date().toISOString(),
    note: 'This route requires authentication',
  });
});

/**
 * POST /api/protected/create
 * Example of a protected route that creates data
 */
router.post('/create', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required',
      });
    }

    // In a real app, you would save to database
    // For now, just return success
    
    res.status(201).json({
      success: true,
      message: 'Data created successfully',
      data: {
        title,
        content,
        createdBy: req.user!.username,
        userId: req.user!._id,
      },
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Create error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to create data',
    });
  }
});

export default router;
