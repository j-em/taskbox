import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError, InvalidIdError } from '../utils/errors';
import { Status } from '../types';

// UUID validation schema - reusable across the app
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Helper to validate UUID params
export function validateUUIDParam(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = req.params[paramName] as string;
      uuidSchema.parse(id);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new InvalidIdError());
      } else {
        next(error);
      }
    }
  };
}

// Tag validation helper
const tagSchema = z.string()
  .min(1, 'Tag must be at least 1 character')
  .max(30, 'Tag must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Tag must be alphanumeric with hyphens/underscores only');

// Status validation - case insensitive
const statusSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    return val.toUpperCase();
  }
  return val;
}, z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']));

// Create task schema
const createTaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .transform(val => val.trim()),
  description: z.string()
    .max(1000, 'Description must be at most 1000 characters')
    .default(''),  // Undefined → "" automatically
  status: statusSchema.default('TODO'),
  scheduledDate: z.union([
    z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid ISO 8601 date format'),
    z.null(),
  ]).optional().default(null),
  tags: z.array(tagSchema)
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),
  inInbox: z.boolean().optional().default(false),
});

// Update task schema - all fields required
const updateTaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .transform(val => val.trim()),
  description: z.string()
    .max(1000, 'Description must be at most 1000 characters'),
    // Required, non-nullable, no transform needed
  status: statusSchema,
  scheduledDate: z.union([
    z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid ISO 8601 date format'),
    z.null(),
  ]),
  tags: z.array(tagSchema)
    .max(10, 'Maximum 10 tags allowed'),
  inInbox: z.boolean().optional(),
});

export function validateCreateTask(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = createTaskSchema.parse(req.body);
    // Update req.body with normalized values
    req.body = result;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details: Record<string, string> = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        details[path || 'unknown'] = issue.message;
      }
      next(new ValidationError(details));
    } else {
      next(error);
    }
  }
}

export function validateUpdateTask(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = updateTaskSchema.parse(req.body);
    // Update req.body with normalized values
    req.body = result;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details: Record<string, string> = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        details[path || 'unknown'] = issue.message;
      }
      next(new ValidationError(details));
    } else {
      next(error);
    }
  }
}
