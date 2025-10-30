import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { updateProfileSchema } from './user.schemas';
import { avatarUpload } from '../../middleware/upload.middleware';

const router = Router();

/**
 * All user routes require authentication
 */
router.use(authenticate);

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', userController.getProfile);

/**
 * PATCH /api/users/me
 * Update user profile
 */
router.patch(
  '/me',
  validate(updateProfileSchema),
  userController.updateProfile
);

/**
 * POST /api/users/me/avatar
 * Upload user avatar
 */
router.post(
  '/me/avatar',
  avatarUpload.single('avatar'),
  userController.uploadAvatar
);

/**
 * DELETE /api/users/me
 * Delete user account
 */
router.delete('/me', userController.deleteAccount);

export default router;
