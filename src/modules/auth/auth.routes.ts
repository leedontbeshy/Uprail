import { Router } from 'express';
import * as authController from './auth.controller';
import { validateBody } from '../../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schemas';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  validateBody(registerSchema),
  authController.register
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  validateBody(loginSchema),
  authController.login
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

export default router;
