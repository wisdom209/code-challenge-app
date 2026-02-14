import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import JwtService from '../utils/jwt';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/register
 * Register a new user with email, password, and username
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "username": "johndoe"
 * }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, username, securityQuestion, securityAnswer } =
      req.body;

    // Step 1: Validate required fields
    if (
      !email ||
      !password ||
      !username ||
      !securityQuestion ||
      !securityAnswer
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details:
          'Email, password, and username, security question and answer are required',
      });
    }

    if (securityQuestion && securityAnswer) {
      if (securityAnswer.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Security answer too short',
          details: 'Security answer must be at least 2 characters',
        });
      }
    }

    // Step 2: Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Step 3: Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password too short',
        details: 'Password must be at least 8 characters',
      });
    }

    // Step 4: Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid username',
        details: 'Username can only contain letters, numbers, and underscores',
      });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        error: 'Invalid username length',
        details: 'Username must be between 3 and 30 characters',
      });
    }

    // Step 5: Check if user already exists (email )
    const existingUserByEmail = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
        message: 'A user with this email already exists',
      });
    }

    // Validate security question if provided
    let securityAnswerHash: string | undefined;
    if (securityQuestion && securityAnswer) {
      if (securityAnswer.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Security answer too short',
          details: 'Security answer must be at least 2 characters',
        });
      }
      const salt = await bcrypt.genSalt(10);
      securityAnswerHash = await bcrypt.hash(
        securityAnswer.toLowerCase().trim(),
        salt
      );
    }

    // Step 6: Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password,
      username,
      securityQuestion:
        securityQuestion || 'What is your favorite programming language?',
      securityAnswerHash,
      isActive: true,
      isVerified: false,
    });

    // Step 7: Save user to database
    await newUser.save();

    // Step 8: Generate JWT token
    const token = JwtService.generateToken(newUser._id, newUser.username);

    // Step 9: Update last login
    newUser.lastLoginAt = new Date();
    await newUser.save();

    // Step 10: Return success response
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        isActive: newUser.isActive,
        isVerified: newUser.isVerified,
        createdAt: newUser.createdAt,
		role: newUser.role
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.join(', '),
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        error: 'Duplicate entry',
        details: `A user with this ${field} already exists`,
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/login
 * Login with email and password
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Step 1: Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        details: 'Email and password are required',
      });
    }

    // Step 2: Find user by email (with password selected)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    ); // Include password field which is normally excluded

    // Step 3: Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'No user found with this email',
      });
    }

    // Step 4: Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account disabled',
        message: 'This account has been deactivated',
      });
    }

    // Step 5: Compare passwords

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Incorrect password',
      });
    }

    // Step 6: Generate JWT token
    const token = JwtService.generateToken(user._id, user.username);

    // Step 7: Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Step 8: Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isActive: user.isActive,
        isVerified: user.isVerified,
        lastLoginAt: user.lastLoginAt,
		role: user.role
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/verify-token
 * Verify if a JWT token is still valid
 *
 * Request Body:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.post('/verify-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    // Verify the token
    const payload = JwtService.verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The token is invalid or has expired',
      });
    }

    // Find the user
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'The user associated with this token no longer exists',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account disabled',
        message: 'This account has been deactivated',
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter((payload as any).iat || 0)) {
      return res.status(401).json({
        success: false,
        error: 'Token revoked',
        message: 'Password was changed. Please log in again.',
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
		role: user.role
      },
    });
  } catch (error: any) {
    console.error('Token verification error:', error);

    return res.status(500).json({
      success: false,
      error: 'Token verification failed',
    });
  }
});

/**
 * GET /api/me
 * Get current user profile (protected route)
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const user = req.user as any;

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        accountAgeDays: user.accountAgeDays,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/security-question/:username
 * Get security question for a user (public)
 */
router.get(
  '/security-question/:username',
  async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      const user = await User.findOne({ username }).select('securityQuestion');

      // Always return question even if user not found (prevent enumeration)
      const question =
        user?.securityQuestion || 'What is your favorite programming language?';

      res.status(200).json({
        success: true,
        question,
      });
    } catch (error: any) {
      console.error('Get security question error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch security question',
      });
    }
  }
);

/**
 * POST /api/verify-security-answer
 * Verify security answer and get reset token
 */
router.post('/verify-security-answer', async (req: Request, res: Response) => {
  try {
    const { username, answer } = req.body;

    if (!username || !answer) {
      return res.status(400).json({
        success: false,
        error: 'Username and answer are required',
      });
    }

    const user = await User.findOne({ username }).select('+securityAnswerHash');

    if (!user || !user.securityAnswerHash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const isCorrect = await user.compareSecurityAnswer(answer);

    if (!isCorrect) {
      return res.status(401).json({
        success: false,
        error: 'Invalid answer',
      });
    }

    // Generate temporary reset token (valid for 10 minutes)
    const resetToken = JwtService.generateToken(user._id, user.username);

    res.status(200).json({
      success: true,
      message: 'Security answer verified',
      resetToken, // Use this token to reset password
    });
  } catch (error: any) {
    console.error('Verify answer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify answer',
    });
  }
});

/**
 * POST /api/reset-password-simple
 * Reset password using reset token from security question
 */
router.post('/reset-password-simple', async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Reset token and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password too short',
        details: 'Password must be at least 8 characters',
      });
    }

    // Verify the reset token
    const payload = JwtService.verifyToken(resetToken);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
    }

    const user = await User.findById(payload.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // Generate new auth token
    const newToken = JwtService.generateToken(user._id, user.username);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: newToken,
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
    });
  }
});
export default router;
