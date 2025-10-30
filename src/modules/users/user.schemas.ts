import { z } from 'zod';

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  timezone: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
