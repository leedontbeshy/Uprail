import { Request, Response, NextFunction } from 'express';
import * as streakService from './streak.service';
import { successResponse } from '../../utils/response.util';

/**
 * Get streak information for the authenticated user
 * GET /api/streaks
 */
export async function getStreaks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const streakInfo = await streakService.getStreakInfo(userId);

    res.json(
      successResponse({
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        lastActiveDate: streakInfo.lastActiveDate,
      })
    );
  } catch (error) {
    next(error);
  }
}
