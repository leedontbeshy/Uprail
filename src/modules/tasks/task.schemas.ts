import { z } from 'zod';

/**
 * Create task schema
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * Update task schema
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional().nullable(),
  isCompleted: z.boolean().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
