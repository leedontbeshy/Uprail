import * as taskRepository from './task.repository';
import { Task } from '@prisma/client';

/**
 * Create a new task
 */
export async function createTask(
  userId: string,
  data: { title: string; description?: string }
): Promise<Task> {
  return await taskRepository.createTask({
    title: data.title,
    description: data.description,
    userId,
  });
}

/**
 * Get all tasks for a user
 */
export async function getUserTasks(userId: string): Promise<Task[]> {
  return await taskRepository.getTasksByUserId(userId);
}

/**
 * Get a single task by ID
 * @throws Error if task not found
 */
export async function getTaskById(taskId: string): Promise<Task> {
  const task = await taskRepository.getTaskById(taskId);

  if (!task) {
    throw new Error('Task not found');
  }

  return task;
}

/**
 * Update a task with ownership validation
 * @throws Error if task not found or user doesn't own the task
 */
export async function updateTask(
  taskId: string,
  userId: string,
  data: { title?: string; description?: string | null; isCompleted?: boolean }
): Promise<Task> {
  const task = await taskRepository.getTaskById(taskId);

  if (!task) {
    throw new Error('Task not found');
  }

  if (task.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return await taskRepository.updateTask(taskId, data);
}

/**
 * Delete a task with ownership validation
 * @throws Error if task not found or user doesn't own the task
 */
export async function deleteTask(taskId: string, userId: string): Promise<void> {
  const task = await taskRepository.getTaskById(taskId);

  if (!task) {
    throw new Error('Task not found');
  }

  if (task.userId !== userId) {
    throw new Error('Unauthorized');
  }

  await taskRepository.deleteTask(taskId);
}
