import { Router } from 'express';
import * as taskController from './task.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createTaskSchema, updateTaskSchema } from './task.schemas';

const router = Router();

/**
 * All task routes require authentication
 */
router.use(authenticate);

/**
 * GET /api/tasks
 * Get all tasks for the authenticated user
 */
router.get('/', taskController.getTasks);

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', validate(createTaskSchema), taskController.createTask);

/**
 * GET /api/tasks/:id
 * Get a single task by ID
 */
router.get('/:id', taskController.getTaskById);

/**
 * PATCH /api/tasks/:id
 * Update a task
 */
router.patch('/:id', validate(updateTaskSchema), taskController.updateTask);

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', taskController.deleteTask);

export default router;
