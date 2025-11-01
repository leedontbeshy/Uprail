import { prisma } from '../../config/database';
import { SessionStatus } from '@prisma/client';

export interface UpdateProfileData {
  timezone?: string;
  avatarUrl?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  avatarUrl: string | null;
  timezone: string;
  totalFocusTime: number;
  currentStreak: number;
  longestStreak: number;
  achievementCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get user by ID (basic info only)
 */
export async function getUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Get user profile with calculated statistics
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      pomodoroSessions: {
        where: {
          status: SessionStatus.COMPLETED,
        },
        select: {
          duration: true,
          startTime: true,
        },
        orderBy: {
          startTime: 'desc',
        },
      },
      userAchievements: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Calculate total focus time (sum of completed session durations)
  const totalFocusTime = user.pomodoroSessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreaks(
    user.pomodoroSessions.map((s) => s.startTime),
    user.timezone
  );

  // Get achievement count
  const achievementCount = user.userAchievements.length;

  return {
    id: user.id,
    email: user.email,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    totalFocusTime,
    currentStreak,
    longestStreak,
    achievementCount,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateProfileData
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data,
  });
}

/**
 * Delete user and all associated data
 */
export async function deleteUser(userId: string): Promise<void> {
  await prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * Calculate current and longest streaks from session dates
 */
function calculateStreaks(
  sessionDates: Date[],
  timezone: string
): { currentStreak: number; longestStreak: number } {
  if (sessionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Group sessions by calendar day in user's timezone
  const uniqueDays = new Set<string>();
  sessionDates.forEach((date) => {
    const dayString = toTimezoneDateString(date, timezone);
    uniqueDays.add(dayString);
  });

  // Sort days in descending order (most recent first)
  const sortedDays = Array.from(uniqueDays).sort((a, b) => b.localeCompare(a));

  if (sortedDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate current streak
  const today = toTimezoneDateString(new Date(), timezone);
  const yesterday = toTimezoneDateString(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
    timezone
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Check if streak is still active (today or yesterday)
  if (sortedDays[0] === today || sortedDays[0] === yesterday) {
    let expectedDate = sortedDays[0];

    for (const day of sortedDays) {
      if (day === expectedDate) {
        currentStreak++;
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);

        // Move to previous day
        const date = new Date(day);
        date.setDate(date.getDate() - 1);
        expectedDate = toTimezoneDateString(date, timezone);
      } else {
        // Gap found, reset temp streak
        tempStreak = 1;
        if (day === expectedDate) {
          const date = new Date(day);
          date.setDate(date.getDate() - 1);
          expectedDate = toTimezoneDateString(date, timezone);
        } else {
          break;
        }
      }
    }
  } else {
    // Streak is broken, but calculate longest streak from history
    tempStreak = 1;
    let expectedDate = sortedDays[0];
    const date = new Date(expectedDate);
    date.setDate(date.getDate() - 1);
    expectedDate = toTimezoneDateString(date, timezone);

    for (let i = 1; i < sortedDays.length; i++) {
      if (sortedDays[i] === expectedDate) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);

        const date = new Date(expectedDate);
        date.setDate(date.getDate() - 1);
        expectedDate = toTimezoneDateString(date, timezone);
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        expectedDate = sortedDays[i];
        const date = new Date(expectedDate);
        date.setDate(date.getDate() - 1);
        expectedDate = toTimezoneDateString(date, timezone);
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { currentStreak, longestStreak };
}

/**
 * Convert date to YYYY-MM-DD string in specified timezone
 */
function toTimezoneDateString(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    return date.toISOString().split('T')[0];
  }
}
