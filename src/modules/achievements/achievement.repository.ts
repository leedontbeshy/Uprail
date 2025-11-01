import { prisma } from '../../config/database';
import { Achievement, UserAchievement } from '@prisma/client';
import { AchievementWithUnlock } from './achievement.types';

/**
 * Get all achievements
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  return await prisma.achievement.findMany({
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * Get all achievements with unlock status for a user
 */
export async function getAchievementsWithUnlockStatus(
  userId: string
): Promise<AchievementWithUnlock[]> {
  return await prisma.achievement.findMany({
    include: {
      userAchievements: {
        where: {
          userId,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * Get unlocked achievements for a user
 */
export async function getUnlockedAchievements(userId: string) {
  return await prisma.userAchievement.findMany({
    where: {
      userId,
    },
    include: {
      achievement: true,
    },
    orderBy: {
      unlockedAt: 'desc',
    },
  });
}

/**
 * Award an achievement to a user
 * Uses unique constraint to ensure achievement is awarded only once
 */
export async function awardAchievement(
  userId: string,
  achievementId: string
): Promise<UserAchievement | null> {
  try {
    return await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
      },
      include: {
        achievement: true,
      },
    });
  } catch (error: any) {
    // If unique constraint violation, achievement already awarded
    if (error.code === 'P2002') {
      return null;
    }
    throw error;
  }
}

/**
 * Check if user has unlocked a specific achievement
 */
export async function hasAchievement(
  userId: string,
  achievementId: string
): Promise<boolean> {
  const count = await prisma.userAchievement.count({
    where: {
      userId,
      achievementId,
    },
  });

  return count > 0;
}

/**
 * Get achievement by name
 */
export async function getAchievementByName(
  name: string
): Promise<Achievement | null> {
  return await prisma.achievement.findUnique({
    where: {
      name,
    },
  });
}
