import { Request, Response, NextFunction } from 'express';
import * as achievementService from './achievement.service';
import { successResponse } from '../../utils/response.util';

/**
 * Get all achievements with unlock status for the authenticated user
 * GET /api/achievements
 */
export async function getAllAchievements(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const achievements = await achievementService.getAllAchievementsForUser(userId);

    res.json(
      successResponse({
        achievements,
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get only unlocked achievements for the authenticated user
 * GET /api/achievements/unlocked
 */
export async function getUnlockedAchievements(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const achievements = await achievementService.getUnlockedAchievementsForUser(userId);

    res.json(
      successResponse({
        achievements,
      })
    );
  } catch (error) {
    next(error);
  }
}
