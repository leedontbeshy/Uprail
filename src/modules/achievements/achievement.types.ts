import { Achievement, UserAchievement } from '@prisma/client';

export interface AchievementCriteria {
  type: 'session_count' | 'streak' | 'focus_time';
  threshold: number;
  unit?: string;
}

export interface AchievementDTO {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  unlockedAt?: Date;
  isUnlocked: boolean;
}

export type AchievementWithUnlock = Achievement & {
  userAchievements: UserAchievement[];
};
