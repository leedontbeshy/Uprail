import { Request, Response } from 'express';
import * as authService from './auth.service';
import {
  sendSuccess,
  sendError,
  sendConflictError,
  sendAuthError,
} from '../../utils/response.util';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.schemas';

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(
  req: Request<{}, {}, RegisterInput>,
  res: Response
): Promise<void> {
  try {
    const { email, password } = req.body;

    const result = await authService.register(email, password);

    sendSuccess(res, result, 201, 'User registered successfully');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Email already registered') {
        sendConflictError(res, error.message);
        return;
      }
    }
    sendError(res, 'REGISTRATION_ERROR', 'Failed to register user', 500);
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(
  req: Request<{}, {}, LoginInput>,
  res: Response
): Promise<void> {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    sendSuccess(res, result, 200, 'Login successful');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        sendAuthError(res, 'Invalid email or password');
        return;
      }
    }
    sendError(res, 'LOGIN_ERROR', 'Failed to login', 500);
  }
}

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(
  req: Request<{}, {}, ForgotPasswordInput>,
  res: Response
): Promise<void> {
  try {
    const { email } = req.body;

    await authService.forgotPassword(email);

    // Always return success to prevent email enumeration
    sendSuccess(
      res,
      { message: 'If the email exists, a password reset link has been sent' },
      200
    );
  } catch (error) {
    sendError(res, 'FORGOT_PASSWORD_ERROR', 'Failed to process request', 500);
  }
}

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export async function resetPassword(
  req: Request<{}, {}, ResetPasswordInput>,
  res: Response
): Promise<void> {
  try {
    const { token, password } = req.body;

    await authService.resetPassword(token, password);

    sendSuccess(res, { message: 'Password reset successfully' }, 200);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid or expired reset token') {
        sendError(res, 'INVALID_TOKEN', error.message, 400);
        return;
      }
    }
    sendError(res, 'RESET_PASSWORD_ERROR', 'Failed to reset password', 500);
  }
}
