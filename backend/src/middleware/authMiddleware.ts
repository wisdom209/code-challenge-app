import { Request, Response, NextFunction } from 'express';
import JwtService, { TokenPayload } from '../utils/jwt';
import User, { IUser } from '../models/User';

// Tell TypeScript that we're adding a 'user' property to Request objects
declare global {
  namespace Express {
    interface Request {
      user?: IUser;  // This will store the authenticated user
    }
  }
}

/**
 * Middleware that checks if user is authenticated
 * If they are, it attaches the user to the request
 * If they aren't, it returns a 401 error
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Step 1: Get the Authorization header
    const authHeader = req.headers.authorization;
    
    // Step 2: Extract the token from the header
    const token = JwtService.extractTokenFromHeader(authHeader);
    
    // Step 3: If no token provided, return error
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'You need to be logged in to access this resource',
      });
    }

    // Step 4: Verify the token
    const payload = JwtService.verifyToken(token);
    
    // Step 5: If token is invalid or expired
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Your session has expired or is invalid. Please log in again.',
      });
    }

    // Step 6: Find the user in the database
    const user = await User.findById(payload.userId);
    
    // Step 7: If user doesn't exist (maybe deleted)
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'The user associated with this token no longer exists',
      });
    }

    // Step 8: Check if user is active
    if (!user.isActive) {
      return res.status(403).json({  // 403 = Forbidden (different from 401 Unauthorized)
        success: false,
        error: 'Account deactivated',
        message: 'Your account has been deactivated',
      });
    }

    // Step 9: Attach user to the request object
    // This makes the user available in all subsequent middleware and route handlers
    req.user = user;

    // Step 10: Move to the next middleware or route handler
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    
    // If something unexpected happens
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'An error occurred while trying to authenticate',
    });
  }
};

/**
 * Optional authentication middleware
 * If user is logged in, attach them to request
 * If not, continue anyway (doesn't block the request)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JwtService.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = JwtService.verifyToken(token);
      
      if (payload) {
        const user = await User.findById(payload.userId);
        
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // If optional auth fails, just continue without user
    next();
  }
};
