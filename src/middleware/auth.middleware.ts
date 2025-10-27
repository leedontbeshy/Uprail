import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { sendAuthError } from '../utils/response.util';

/**
 * JWT authentication middleware
 * Verifies the token from Authorization header and attaches user to request
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      sendAuthError(res, 'No authorization token provided');
      return;
    }

    // Check if it's a Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      sendAuthError(res, 'Invalid authorization format. Use: Bearer <token>');
      return;
    }

    const token = parts[1];

    // Verify token
    const payload = verifyToken(token);

    // Attach user to request
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof Error) {
      sendAuthError(res, error.message);
    } else {
      sendAuthError(res, 'Authentication failed');
    }
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if missing
 */
export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const payload = verifyToken(token);
        req.user = payload;
      }
    }

    next();
  } catch {
    // Silently continue without user
    next();
  }
}
