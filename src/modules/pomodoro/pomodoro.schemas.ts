import { z } from 'zod';

/**
 * Start Pomodoro session schema
 */
export const startSessionSchema = z.object({
  taskId: z.string().uuid('Invalid task ID format'),
  duration: z
    .number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 minute')
    .max(120, 'Duration must not exceed 120 minutes'),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

/**
 * Query sessions schema (for filtering)
 */
export const querySessionsSchema = z.object({
  taskId: z.string().uuid('Invalid task ID format').optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type QuerySessionsInput = z.infer<typeof querySessionsSchema>;
