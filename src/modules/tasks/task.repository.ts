import { prisma } from '../../config/database';
import { Task } from '@prisma/client';

export interface CreateTaskData {
  title: string;
  description?: string;
  userId: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  isCompleted?: boolean;
}

/**
 * Create a new task
 */
export async function createTask(data: CreateTaskData): Promise<Task> {
  return await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      userId: data.userId,
    },
  });
}

/**
 * Get all tasks for a user
 */
export async function getTasksByUserId(userId: string): Promise<Task[]> {
  return await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single task by ID
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  return await prisma.task.findUnique({
    where: { id: taskId },
  });
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: string,
  data: UpdateTaskData
): Promise<Task> {
  return await prisma.task.update({
    where: { id: taskId },
    data,
  });
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  await prisma.task.delete({
    where: { id: taskId },
  });
}
