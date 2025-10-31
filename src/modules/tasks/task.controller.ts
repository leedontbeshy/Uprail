import { Request, Response } from 'express';
import * as taskService from './task.service';
import {
  sendSuccess,
  sendError,
  sendNotFoundError,
  sendAuthorizationError,
} from '../../utils/response.util';
import { CreateTaskInput, UpdateTaskInput } from './task.schemas';

/**
 * Get all tasks for the authenticated user
 * GET /api/tasks
 */
export async function getTasks(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const tasks = await taskService.getUserTasks(userId);

    sendSuccess(res, tasks, 200);
  } catch (error) {
    sendError(res, 'GET_TASKS_ERROR', 'Failed to retrieve tasks', 500);
  }
}

/**
 * Create a new task
 * POST /api/tasks
 */
export async function createTask(
  req: Request<{}, {}, CreateTaskInput>,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const taskData = req.body;

    const task = await taskService.createTask(userId, taskData);

    sendSuccess(res, task, 201, 'Task created successfully');
  } catch (error) {
    sendError(res, 'CREATE_TASK_ERROR', 'Failed to create task', 500);
  }
}

/**
 * Get a single task by ID
 * GET /api/tasks/:id
 */
export async function getTaskById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const task = await taskService.getTaskById(id);

    sendSuccess(res, task, 200);
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      sendNotFoundError(res, 'Task not found');
      return;
    }
    sendError(res, 'GET_TASK_ERROR', 'Failed to retrieve task', 500);
  }
}

/**
 * Update a task
 * PATCH /api/tasks/:id
 */
export async function updateTask(
  req: Request<{ id: string }, {}, UpdateTaskInput>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const updateData = req.body;

    const task = await taskService.updateTask(id, userId, updateData);

    sendSuccess(res, task, 200, 'Task updated successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      sendNotFoundError(res, 'Task not found');
      return;
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      sendAuthorizationError(res, 'You do not have permission to update this task');
      return;
    }
    sendError(res, 'UPDATE_TASK_ERROR', 'Failed to update task', 500);
  }
}

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
export async function deleteTask(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await taskService.deleteTask(id, userId);

    sendSuccess(
      res,
      { message: 'Task deleted successfully' },
      200,
      'Task deleted successfully'
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      sendNotFoundError(res, 'Task not found');
      return;
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      sendAuthorizationError(res, 'You do not have permission to delete this task');
      return;
    }
    sendError(res, 'DELETE_TASK_ERROR', 'Failed to delete task', 500);
  }
}
