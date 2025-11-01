import * as achievementRepository from './achievement.repository';
import * as pomodoroRepository from '../pomodoro/pomodoro.repository';
import * as streakService from '../streaks/streak.service';
import { AchievementDTO } from './achievement.types';
import { UserAchievement } from '@prisma/client';

/**
 * Get all achievements with unlock status for a user
 */
export async function getAllAchievementsForUser(
  userId: string
): Promise<AchievementDTO[]> {
  const achievements = await achievementRepository.getAchievementsWithUnlockStatus(userId);

  return achievements.map((achievement) => ({
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    iconUrl: achievement.iconUrl || undefined,
    unlockedAt: achievement.userAchievements[0]?.unlockedAt,
    isUnlocked: achievement.userAchievements.length > 0,
  }));
}

/**
 * Get only unlocked achievements for a user
 */
export async function getUnlockedAchievementsForUser(
  userId: string
): Promise<AchievementDTO[]> {
  const unlockedAchievements = await achievementRepository.getUnlockedAchievements(userId);

  return unlockedAchievements.map((ua) => ({
    id: ua.achievement.id,
    name: ua.achievement.name,
    description: ua.achievement.description,
    iconUrl: ua.achievement.iconUrl || undefined,
    unlockedAt: ua.unlockedAt,
    isUnlocked: true,
  }));
}

/**
 * Check and award "First Focus" achievement
 * Criteria: Complete first Pomodoro session
 */
export async function checkFirstFocusAchievement(
  userId: string
): Promise<UserAchievement | null> {
  const achievement = await achievementRepository.getAchievementByName('First Focus');
  
  if (!achievement) {
    return null;
  }

  // Check if already awarded
  const hasAchievement = await achievementRepository.hasAchievement(userId, achievement.id);
  if (hasAchievement) {
    return null;
  }

  // Check if user has completed at least one session
  const completedCount = await pomodoroRepository.getCompletedSessionsCount(userId);
  
  if (completedCount >= 1) {
    return await achievementRepository.awardAchievement(userId, achievement.id);
  }

  return null;
}

/**
 * Check and award "Week Warrior" achievement
 * Criteria: Reach 7-day streak
 */
export async function checkWeekWarriorAchievement(
  userId: string
): Promise<UserAchievement | null> {
  const achievement = await achievementRepository.getAchievementByName('Week Warrior');
  
  if (!achievement) {
    return null;
  }

  // Check if already awarded
  const hasAchievement = await achievementRepository.hasAchievement(userId, achievement.id);
  if (hasAchievement) {
    return null;
  }

  // Check current streak
  const streakInfo = await streakService.calculateStreaks(userId);
  
  if (streakInfo.currentStreak >= 7) {
    return await achievementRepository.awardAchievement(userId, achievement.id);
  }

  return null;
}

/**
 * Check and award "Dedicated Learner" achievement
 * Criteria: Accumulate 25 hours (1500 minutes) of focus time
 */
export async function checkDedicatedLearnerAchievement(
  userId: string
): Promise<UserAchievement | null> {
  const achievement = await achievementRepository.getAchievementByName('Dedicated Learner');
  
  if (!achievement) {
    return null;
  }

  // Check if already awarded
  const hasAchievement = await achievementRepository.hasAchievement(userId, achievement.id);
  if (hasAchievement) {
    return null;
  }

  // Check total focus time
  const totalFocusTime = await pomodoroRepository.calculateFocusTime(userId);
  
  if (totalFocusTime >= 1500) {
    return await achievementRepository.awardAchievement(userId, achievement.id);
  }

  return null;
}

/**
 * Check all achievements after a Pomodoro session is completed
 * This should be called after completing a session
 */
export async function checkAchievementsAfterSession(
  userId: string
): Promise<UserAchievement[]> {
  const awarded: UserAchievement[] = [];

  // Check First Focus (session count)
  const firstFocus = await checkFirstFocusAchievement(userId);
  if (firstFocus) {
    awarded.push(firstFocus);
  }

  // Check Week Warrior (streak)
  const weekWarrior = await checkWeekWarriorAchievement(userId);
  if (weekWarrior) {
    awarded.push(weekWarrior);
  }

  // Check Dedicated Learner (focus time)
  const dedicatedLearner = await checkDedicatedLearnerAchievement(userId);
  if (dedicatedLearner) {
    awarded.push(dedicatedLearner);
  }

  return awarded;
}
