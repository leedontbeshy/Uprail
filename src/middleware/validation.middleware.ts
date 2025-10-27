import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendValidationError } from '../utils/response.util';

/**
 * Validation target type
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get the data to validate based on target
      const dataToValidate = req[target];

      // Validate the data
      const validatedData = schema.parse(dataToValidate);

      // Replace the original data with validated data
      req[target] = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for better readability
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        sendValidationError(res, formattedErrors);
      } else {
        sendValidationError(res, 'Validation failed');
      }
    }
  };
}

/**
 * Validate request body
 */
export function validateBody(schema: ZodSchema) {
  return validate(schema, 'body');
}

/**
 * Validate request query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}

/**
 * Validate request URL parameters
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}
