import { prisma } from '../config/database';
import { hashPassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';

/**
 * Create a test user in the database
 */
export async function createTestUser(data?: {
  email?: string;
  password?: string;
  timezone?: string;
}) {
  const email = data?.email || `test-${Date.now()}@example.com`;
  const password = data?.password || 'Test123!@#';
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      timezone: data?.timezone || 'UTC',
    },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  return { user, password, token };
}

/**
 * Create a test task for a user
 */
export async function createTestTask(userId: string, data?: {
  title?: string;
  description?: string;
}) {
  return await prisma.task.create({
    data: {
      userId,
      title: data?.title || 'Test Task',
      description: data?.description || 'Test Description',
    },
  });
}

/**
 * Create a test Pomodoro session
 */
export async function createTestPomodoroSession(
  userId: string,
  taskId: string,
  data?: {
    duration?: number;
    status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    startTime?: Date;
    endTime?: Date;
  }
) {
  return await prisma.pomodoroSession.create({
    data: {
      userId,
      taskId,
      duration: data?.duration || 25,
      status: data?.status || 'COMPLETED',
      startTime: data?.startTime || new Date(),
      endTime: data?.endTime,
    },
  });
}
