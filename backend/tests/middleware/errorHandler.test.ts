import { jest, describe, it, expect } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middleware/errorHandler';
import { ValidationError, NotFoundError, InternalError, AppError } from '../../src/utils/errors';

describe('Error Handler Middleware', () => {
  const mockRequest = () => ({} as Request);
  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnThis() as any;
    res.json = jest.fn().mockReturnThis() as any;
    return res;
  };
  const mockNext = () => jest.fn() as NextFunction;

  it('should format VALIDATION_ERROR with field-level details', () => {
    const err = new ValidationError({ title: 'Title is required', scheduledDate: 'Invalid date' });
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { title: 'Title is required', scheduledDate: 'Invalid date' },
      },
    });
  });

  it('should format NOT_FOUND with empty details object', () => {
    const err = new NotFoundError('Task does not exist');
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Task does not exist',
        details: {},
      },
    });
  });

  it('should return 500 for unexpected errors with INTERNAL_ERROR code', () => {
    const err = new Error('Unexpected error');
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: {},
      },
    });
  });
});
