import { Request, Response } from 'express';
import * as userService from './user.service';
import {
  sendSuccess,
  sendError,
  sendNotFoundError,
} from '../../utils/response.util';
import { UpdateProfileInput } from './user.schemas';

/**
 * Get current user profile
 * GET /api/users/me
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const profile = await userService.getProfile(userId);

    sendSuccess(res, profile, 200);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      sendNotFoundError(res, 'User not found');
      return;
    }
    sendError(res, 'GET_PROFILE_ERROR', 'Failed to retrieve profile', 500);
  }
}

/**
 * Update user profile
 * PATCH /api/users/me
 */
export async function updateProfile(
  req: Request<{}, {}, UpdateProfileInput>,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const updateData = req.body;

    const profile = await userService.updateProfile(userId, updateData);

    sendSuccess(res, profile, 200, 'Profile updated successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      sendNotFoundError(res, 'User not found');
      return;
    }
    sendError(res, 'UPDATE_PROFILE_ERROR', 'Failed to update profile', 500);
  }
}

/**
 * Upload user avatar
 * POST /api/users/me/avatar
 */
export async function uploadAvatar(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      sendError(res, 'NO_FILE', 'No file uploaded', 400);
      return;
    }

    // Construct avatar URL (relative path)
    const avatarUrl = `/uploads/${req.file.filename}`;

    const profile = await userService.updateAvatar(userId, avatarUrl);

    sendSuccess(res, profile, 200, 'Avatar uploaded successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      sendNotFoundError(res, 'User not found');
      return;
    }
    sendError(res, 'UPLOAD_AVATAR_ERROR', 'Failed to upload avatar', 500);
  }
}

/**
 * Delete user account
 * DELETE /api/users/me
 */
export async function deleteAccount(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;

    await userService.deleteAccount(userId);

    sendSuccess(
      res,
      { message: 'Account deleted successfully' },
      200,
      'Account deleted successfully'
    );
  } catch (error) {
    sendError(res, 'DELETE_ACCOUNT_ERROR', 'Failed to delete account', 500);
  }
}
