import { NextFunction, Request, Response } from 'express';
import { requireAuth } from './authMiddleware';

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // First check authentication
  await requireAuth(req, res, async () => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      // Check if user has admin role
      if (user.role !== 'admin' && user.role !== 'super_admin') {
		console.log(user, "what's up!!!")
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required',
        });
      }

      next();
    } catch (error) {
      console.error('Admin check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Admin verification failed',
      });
    }
  });
};
