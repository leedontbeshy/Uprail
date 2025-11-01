import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  sendValidationError,
  sendAuthError,
  sendNotFoundError,
  sendConflictError,
  sendInternalError,
  sendError,
} from '../utils/response.util';

/**
 * Custom error classes
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, 'AUTHENTICATION_ERROR', message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, 'AUTHORIZATION_ERROR', message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error occurred') {
    super(503, 'DATABASE_ERROR', message);
    this.name = 'DatabaseError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message);
    this.name = 'InternalServerError';
  }
}

/**
 * Global error handling middleware
 * Catches all errors and formats them consistently
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging (unhandled exceptions are logged with full stack trace)
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
    }));
    sendValidationError(res, formattedErrors);
    return;
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Prisma errors
  if (isPrismaError(err)) {
    handlePrismaError(err, res);
    return;
  }

  // Handle JWT errors (if not caught by auth middleware)
  if (err.name === 'JsonWebTokenError') {
    sendAuthError(res, 'Invalid token');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendAuthError(res, 'Token has expired');
    return;
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    handleMulterError(err as any, res);
    return;
  }

  // Default to 500 internal server error for unhandled exceptions
  // Log the full error details for debugging
  console.error('Unhandled exception:', {
    error: err,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });
  
  sendInternalError(
    res,
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred'
  );
}

/**
 * Check if error is a Prisma error
 */
function isPrismaError(err: any): boolean {
  return (
    err.name === 'PrismaClientKnownRequestError' ||
    err.name === 'PrismaClientValidationError' ||
    err.name === 'PrismaClientInitializationError' ||
    err.name === 'PrismaClientRustPanicError'
  );
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(err: any, res: Response): void {
  // Handle validation errors
  if (err.name === 'PrismaClientValidationError') {
    sendValidationError(res, 'Invalid data provided');
    return;
  }

  // Handle connection errors
  if (
    err.name === 'PrismaClientInitializationError' ||
    err.name === 'PrismaClientRustPanicError'
  ) {
    sendError(res, 'DATABASE_ERROR', 'Database connection error', 503);
    return;
  }

  // Handle known request errors
  if (err.name === 'PrismaClientKnownRequestError') {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        const target = (err.meta?.target as string[]) || [];
        sendConflictError(
          res,
          `A record with this ${target.join(', ')} already exists`
        );
        break;

      case 'P2025':
        // Record not found
        sendNotFoundError(res, 'Record');
        break;

      case 'P2003':
        // Foreign key constraint violation
        sendValidationError(res, 'Invalid reference to related record');
        break;

      case 'P2014':
        // Required relation violation
        sendValidationError(res, 'Required relation is missing');
        break;

      default:
        // Generic database error
        sendError(res, 'DATABASE_ERROR', 'A database error occurred', 503);
    }
    return;
  }

  // Fallback for unknown Prisma errors
  sendError(res, 'DATABASE_ERROR', 'A database error occurred', 503);
}

/**
 * Handle Multer-specific errors
 */
function handleMulterError(err: any, res: Response): void {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      sendValidationError(res, 'File size exceeds the maximum allowed limit');
      break;

    case 'LIMIT_FILE_COUNT':
      sendValidationError(res, 'Too many files uploaded');
      break;

    case 'LIMIT_UNEXPECTED_FILE':
      sendValidationError(res, 'Unexpected file field');
      break;

    default:
      sendValidationError(res, err.message || 'File upload error');
  }
}

/**
 * 404 Not Found handler
 * Should be registered after all routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  sendNotFoundError(res, `Route ${req.method} ${req.path}`);
}
