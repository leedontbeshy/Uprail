import { prisma } from '../../config/database';
import { PomodoroSession } from '@prisma/client';

/**
 * Get all completed Pomodoro sessions for a user
 */
export async function getCompletedSessions(userId: string): Promise<PomodoroSession[]> {
  return await prisma.pomodoroSession.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
    orderBy: {
      startTime: 'desc',
    },
  });
}

/**
 * Get completed sessions within a date range
 */
export async function getCompletedSessionsInRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<PomodoroSession[]> {
  return await prisma.pomodoroSession.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      startTime: 'desc',
    },
  });
}

/**
 * Check if user has any completed sessions on a specific date
 * Note: This is a utility function for future use
 */
export async function hasCompletedSessionOnDate(
  userId: string,
  date: Date
): Promise<boolean> {
  // Get start and end of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await prisma.pomodoroSession.count({
    where: {
      userId,
      status: 'COMPLETED',
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  return count > 0;
}
