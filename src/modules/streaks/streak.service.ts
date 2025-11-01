import * as streakRepository from './streak.repository';
import * as userRepository from '../users/user.repository';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: Date;
}

/**
 * Convert a date to a calendar day string in the user's timezone
 * Format: YYYY-MM-DD
 */
function toCalendarDay(date: Date, timezone: string): string {
  // Create a date string in the user's timezone
  const dateInTimezone = new Date(
    date.toLocaleString('en-US', { timeZone: timezone })
  );
  
  const year = dateInTimezone.getFullYear();
  const month = String(dateInTimezone.getMonth() + 1).padStart(2, '0');
  const day = String(dateInTimezone.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get the difference in days between two calendar day strings
 */
function getDayDifference(day1: string, day2: string): number {
  const date1 = new Date(day1);
  const date2 = new Date(day2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate streak information for a user
 */
export async function calculateStreaks(userId: string): Promise<StreakInfo> {
  // Get user to access timezone
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const timezone = user.timezone;

  // Get all completed sessions
  const sessions = await streakRepository.getCompletedSessions(userId);

  if (sessions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  // Group sessions by calendar day in user's timezone
  const activeDays = new Set<string>();
  
  for (const session of sessions) {
    const calendarDay = toCalendarDay(session.startTime, timezone);
    activeDays.add(calendarDay);
  }

  // Convert to sorted array (most recent first)
  const sortedDays = Array.from(activeDays).sort((a, b) => b.localeCompare(a));

  if (sortedDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  // Get today and yesterday in user's timezone
  const now = new Date();
  const today = toCalendarDay(now, timezone);
  const yesterday = toCalendarDay(
    new Date(now.getTime() - 24 * 60 * 60 * 1000),
    timezone
  );

  // Calculate current streak
  let currentStreak = 0;
  const mostRecentDay = sortedDays[0];

  // Current streak only counts if the most recent activity was today or yesterday
  if (mostRecentDay === today || mostRecentDay === yesterday) {
    currentStreak = 1;
    
    for (let i = 1; i < sortedDays.length; i++) {
      const dayDiff = getDayDifference(sortedDays[i], sortedDays[i - 1]);
      
      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const dayDiff = getDayDifference(sortedDays[i], sortedDays[i - 1]);
    
    if (dayDiff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: sessions[0].startTime,
  };
}

/**
 * Get streak information for a user
 */
export async function getStreakInfo(userId: string): Promise<StreakInfo> {
  return await calculateStreaks(userId);
}
