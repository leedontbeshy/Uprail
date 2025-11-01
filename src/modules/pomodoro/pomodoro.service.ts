import * as pomodoroRepository from './pomodoro.repository';
import * as taskRepository from '../tasks/task.repository';
import * as achievementService from '../achievements/achievement.service';
import { PomodoroSession, SessionStatus } from '@prisma/client';
import { SessionWithTask } from './pomodoro.repository';

/**
 * Start a new Pomodoro session
 * @throws Error if task not found or user doesn't own the task
 */
export async function startSession(
  userId: string,
  data: { taskId: string; duration: number }
): Promise<PomodoroSession> {
  // Verify task exists and belongs to user
  const task = await taskRepository.getTaskById(data.taskId);

  if (!task) {
    throw new Error('Task not found');
  }

  if (task.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return await pomodoroRepository.createSession({
    userId,
    taskId: data.taskId,
    duration: data.duration,
  });
}

/**
 * Complete a Pomodoro session
 * @throws Error if session not found or user doesn't own the session
 */
export async function completeSession(
  sessionId: string,
  userId: string
): Promise<PomodoroSession> {
  const session = await pomodoroRepository.getSessionById(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.userId !== userId) {
    throw new Error('Unauthorized');
  }

  if (session.status !== 'IN_PROGRESS') {
    throw new Error('Session is not in progress');
  }

  const updatedSession = await pomodoroRepository.updateSession(sessionId, {
    endTime: new Date(),
    status: 'COMPLETED',
  });

  // Check and award achievements after completing session
  // This runs asynchronously and doesn't block the response
  achievementService.checkAchievementsAfterSession(userId).catch((error) => {
    console.error('Error checking achievements:', error);
  });

  return updatedSession;
}

/**
 * Cancel a Pomodoro session
 * @throws Error if session not found or user doesn't own the session
 */
export async function cancelSession(
  sessionId: string,
  userId: string
): Promise<PomodoroSession> {
  const session = await pomodoroRepository.getSessionById(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.userId !== userId) {
    throw new Error('Unauthorized');
  }

  if (session.status !== 'IN_PROGRESS') {
    throw new Error('Session is not in progress');
  }

  return await pomodoroRepository.updateSession(sessionId, {
    endTime: new Date(),
    status: 'CANCELLED',
  });
}

/**
 * Get session history for a user
 */
export async function getSessionHistory(
  userId: string,
  filters: {
    taskId?: string;
    status?: SessionStatus;
    limit?: number;
    offset?: number;
  }
): Promise<SessionWithTask[]> {
  return await pomodoroRepository.getSessionsByUserId({
    userId,
    ...filters,
  });
}

/**
 * Get focus time statistics for a user
 */
export async function getFocusTimeStats(userId: string): Promise<{
  totalFocusTime: number;
  completedSessions: number;
}> {
  const [totalFocusTime, completedSessions] = await Promise.all([
    pomodoroRepository.calculateFocusTime(userId),
    pomodoroRepository.getCompletedSessionsCount(userId),
  ]);

  return {
    totalFocusTime,
    completedSessions,
  };
}
