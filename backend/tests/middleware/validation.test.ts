import { jest, describe, it, expect } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { validateCreateTask, validateUpdateTask } from '../../src/middleware/validation';
import { ValidationError } from '../../src/utils/errors';

describe('Validation Middleware', () => {
  const mockRequest = (body: any = {}) => ({ body } as Request);
  const mockResponse = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response);
  const mockNext = () => jest.fn() as NextFunction;

  describe('validateCreateTask - Valid Input', () => {
    it('should pass valid task data to next() without errors', () => {
      const req = mockRequest({
        title: 'Valid Task',
        description: 'Valid Description',
        status: 'TODO',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: ['tag1', 'tag2'],
      });
      const res = mockResponse();
      const next = jest.fn();

      validateCreateTask(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should normalize status case-insensitive to uppercase', () => {
      const req = mockRequest({
        title: 'Valid Task',
        scheduledDate: '2024-01-15T10:00:00Z',
        status: 'in_progress',
      });
      const res = mockResponse();
      const next = jest.fn();

      validateCreateTask(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.status).toBe('IN_PROGRESS');
    });
  });

  describe('validateCreateTask - Invalid Input', () => {
    it('should return VALIDATION_ERROR for missing title', () => {
      const req = mockRequest({
        scheduledDate: '2024-01-15T10:00:00Z',
      });
      const res = mockResponse();
      const next = jest.fn();

      validateCreateTask(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (next as jest.Mock).mock.calls[0][0] as ValidationError;
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details.title).toBeDefined();
    });

    it('should return VALIDATION_ERROR for title > 200 chars', () => {
      const req = mockRequest({
        title: 'a'.repeat(201),
        scheduledDate: '2024-01-15T10:00:00Z',
      });
      const res = mockResponse();
      const next = jest.fn();

      validateCreateTask(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (next as jest.Mock).mock.calls[0][0] as ValidationError;
      expect(error.details.title).toBeDefined();
    });

    it('should return VALIDATION_ERROR for invalid ISO 8601 date', () => {
      const req = mockRequest({
        title: 'Valid Task',
        scheduledDate: 'invalid-date',
      });
      const res = mockResponse();
      const next = jest.fn();

      validateCreateTask(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (next as jest.Mock).mock.calls[0][0] as ValidationError;
      expect(error.details.scheduledDate).toBeDefined();
    });

    it('should return VALIDATION_ERROR for >10 tags', () => {
      const req = mockRequest({
        title: 'Valid Task',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: Array(11).fill('tag'),
      });
      const res = mockResponse();
      const next = jest.fn();

      validateCreateTask(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (next as jest.Mock).mock.calls[0][0] as ValidationError;
      expect(error.details.tags).toBeDefined();
    });

    it('should return VALIDATION_ERROR for tag >30 chars', () => {
      const req = mockRequest({
        title: 'Valid Task',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: ['a'.repeat(31)],
      });
      const res = mockResponse();
      const next = jest.fn();

      validateCreateTask(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (next as jest.Mock).mock.calls[0][0] as ValidationError;
      // Tag length error is reported on the specific index, e.g., 'tags.0'
      const hasTagError = Object.keys(error.details).some(key => key.startsWith('tags'));
      expect(hasTagError).toBe(true);
    });
  });

  it('validateUpdateTask should require all fields for update (full replacement)', () => {
    const req = mockRequest({
      title: 'Updated Task',
      // Missing description, status, scheduledDate, tags
    });
    const res = mockResponse();
    const next = jest.fn();

    validateUpdateTask(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });
});
