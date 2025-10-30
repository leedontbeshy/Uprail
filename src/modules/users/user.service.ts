import * as userRepository from './user.repository';
import { UserProfile } from './user.repository';

/**
 * Get user profile with statistics
 * @throws Error if user not found
 */
export async function getProfile(userId: string): Promise<UserProfile> {
  const profile = await userRepository.getUserProfile(userId);

  if (!profile) {
    throw new Error('User not found');
  }

  return profile;
}

/**
 * Update user profile
 * @throws Error if user not found
 */
export async function updateProfile(
  userId: string,
  data: { timezone?: string }
): Promise<UserProfile> {
  await userRepository.updateUserProfile(userId, data);

  const profile = await userRepository.getUserProfile(userId);

  if (!profile) {
    throw new Error('User not found');
  }

  return profile;
}

/**
 * Update user avatar
 * @throws Error if user not found
 */
export async function updateAvatar(
  userId: string,
  avatarUrl: string
): Promise<UserProfile> {
  await userRepository.updateUserProfile(userId, { avatarUrl });

  const profile = await userRepository.getUserProfile(userId);

  if (!profile) {
    throw new Error('User not found');
  }

  return profile;
}

/**
 * Delete user account and all associated data
 */
export async function deleteAccount(userId: string): Promise<void> {
  await userRepository.deleteUser(userId);
}
