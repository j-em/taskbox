import { Request, Response, NextFunction } from 'express';
import { AppError, InternalError } from '../utils/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle body-parser and other middleware errors with status codes
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    res.status(err.statusCode).json({
      error: {
        code: 'BAD_REQUEST',
        message: err.message,
        details: {},
      },
    });
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  // Return generic internal error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: {},
    },
  });
}
