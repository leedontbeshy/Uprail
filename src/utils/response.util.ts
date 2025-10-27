import { Response } from 'express';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Send a successful response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): Response {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(response);
}

/**
 * Send a validation error response
 */
export function sendValidationError(
  res: Response,
  details: any
): Response {
  return sendError(
    res,
    'VALIDATION_ERROR',
    'Invalid request data',
    400,
    details
  );
}

/**
 * Send an authentication error response
 */
export function sendAuthError(
  res: Response,
  message: string = 'Authentication failed'
): Response {
  return sendError(res, 'AUTHENTICATION_ERROR', message, 401);
}

/**
 * Send an authorization error response
 */
export function sendAuthorizationError(
  res: Response,
  message: string = 'Insufficient permissions'
): Response {
  return sendError(res, 'AUTHORIZATION_ERROR', message, 403);
}

/**
 * Send a not found error response
 */
export function sendNotFoundError(
  res: Response,
  resource: string = 'Resource'
): Response {
  return sendError(res, 'NOT_FOUND', `${resource} not found`, 404);
}

/**
 * Send a conflict error response
 */
export function sendConflictError(
  res: Response,
  message: string
): Response {
  return sendError(res, 'CONFLICT', message, 409);
}

/**
 * Send an internal server error response
 */
export function sendInternalError(
  res: Response,
  message: string = 'Internal server error'
): Response {
  return sendError(res, 'INTERNAL_ERROR', message, 500);
}
