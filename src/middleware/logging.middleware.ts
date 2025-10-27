import morgan from 'morgan';
import { Request } from 'express';
import { env } from '../config/env';

/**
 * Morgan logging middleware configuration
 * Uses 'combined' format for production and 'dev' format for development
 */
export const loggingMiddleware = morgan(
  env.NODE_ENV === 'production' ? 'combined' : 'dev',
  {
    // Skip logging for health check endpoints to reduce noise
    skip: (req) => {
      const expressReq = req as Request;
      return expressReq.path === '/health' || expressReq.path === '/api/health';
    },
  }
);

/**
 * Custom morgan token for user ID (if authenticated)
 */
morgan.token('user-id', (req: any) => {
  return req.user?.userId || 'anonymous';
});

/**
 * Custom format with user ID
 */
export const detailedLoggingMiddleware = morgan(
  ':method :url :status :response-time ms - :user-id',
  {
    skip: (req) => {
      const expressReq = req as Request;
      return expressReq.path === '/health' || expressReq.path === '/api/health';
    },
  }
);
