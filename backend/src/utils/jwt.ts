import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';

// What information we want to store in the token
export interface TokenPayload {
  userId: string; // Which user this token belongs to
  username: string; // User's GitHub username
}

class JwtService {
  // Get the secret from environment variables
  private static getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set in environment variables');
    }
    return secret;
  }

  // How long tokens should last (24 hours by default)
  private static getExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * Create a new JWT token for a user
   * @param userId - MongoDB ID of the user
   * @param username - User's GitHub username
   * @returns A signed JWT token
   */
  static generateToken(
    userId: Types.ObjectId | string,
    username: string
  ): string {
    // Create the data that will be stored inside the token
    const payload: TokenPayload = {
      userId: userId.toString(),
      username,
    };

    // Sign (create) the token with our secret
	
	return jwt.sign(payload, this.getSecret(), {
		expiresIn: this.getExpiresIn() as SignOptions['expiresIn']
	})
  }

  /**
   * Check if a token is valid and get the data inside it
   * @param token - The JWT token to verify
   * @returns The data from the token if valid, null if invalid
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      // Verify the token hasn't been tampered with and isn't expired
      return jwt.verify(token, this.getSecret()) as TokenPayload;
    } catch (error) {
      // Token is invalid, expired, or malformed
      return null;
    }
  }

  /**
   * Extract just the data from a token without verifying it
   * Useful for checking what's in an expired token
   * @param token - The JWT token
   * @returns The data from the token
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   * Format should be: "Bearer eyJhbGciOiJIUzI1NiIsIn..."
   * @param authHeader - The Authorization header value
   * @returns Just the token part, or null if not found
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    // If there's no header or it doesn't start with "Bearer ", return null
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    // Remove "Bearer " from the beginning to get just the token
    return authHeader.substring(7);
  }
}

export default JwtService;
