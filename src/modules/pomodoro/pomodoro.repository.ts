import { prisma } from '../../config/database';
import { PomodoroSession, SessionStatus } from '@prisma/client';

export interface CreateSessionData {
  userId: string;
  taskId: string;
  duration: number;
}

export interface SessionWithTask extends PomodoroSession {
  task: {
    id: string;
    title: string;
  };
}

export interface QuerySessionsParams {
  userId: string;
  taskId?: string;
  status?: SessionStatus;
  limit?: number;
  offset?: number;
}

/**
 * Create a new Pomodoro session
 */
export async function createSession(data: CreateSessionData): Promise<PomodoroSession> {
  return await prisma.pomodoroSession.create({
    data: {
      userId: data.userId,
      taskId: data.taskId,
      duration: data.duration,
      status: 'IN_PROGRESS',
    },
  });
}

/**
 * Get a session by ID
 */
export async function getSessionById(sessionId: string): Promise<PomodoroSession | null> {
  return await prisma.pomodoroSession.findUnique({
    where: { id: sessionId },
  });
}

/**
 * Get sessions for a user with optional filters
 */
export async function getSessionsByUserId(
  params: QuerySessionsParams
): Promise<SessionWithTask[]> {
  const { userId, taskId, status, limit = 50, offset = 0 } = params;

  return await prisma.pomodoroSession.findMany({
    where: {
      userId,
      ...(taskId && { taskId }),
      ...(status && { status }),
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { startTime: 'desc' },
    take: limit,
    skip: offset,
  });
}

/**
 * Update a session
 */
export async function updateSession(
  sessionId: string,
  data: {
    endTime?: Date;
    status?: SessionStatus;
  }
): Promise<PomodoroSession> {
  return await prisma.pomodoroSession.update({
    where: { id: sessionId },
    data,
  });
}

/**
 * Calculate total focus time for a user (sum of completed session durations)
 */
export async function calculateFocusTime(userId: string): Promise<number> {
  const result = await prisma.pomodoroSession.aggregate({
    where: {
      userId,
      status: 'COMPLETED',
    },
    _sum: {
      duration: true,
    },
  });

  return result._sum.duration || 0;
}

/**
 * Get completed sessions count for a user
 */
export async function getCompletedSessionsCount(userId: string): Promise<number> {
  return await prisma.pomodoroSession.count({
    where: {
      userId,
      status: 'COMPLETED',
    },
  });
}
