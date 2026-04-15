import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { TaskController } from '../../src/controllers/taskController';
import { TaskService } from '../../src/services/taskService';
import { NotFoundError, ValidationError, InvalidIdError } from '../../src/utils/errors';

// Valid UUID for testing
const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const NON_EXISTENT_UUID = '123e4567-e89b-12d3-a456-426614174999';

// Mock TaskService
jest.mock('../../src/services/taskService', () => ({
  TaskService: {
    createTask: jest.fn(),
    getTaskById: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    listTasks: jest.fn(),
  },
}));

describe('TaskController', () => {
  const mockRequest = (params: any = {}, body: any = {}, query: any = {}) => ({
    params,
    body,
    query,
  } as Request);
  
  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnThis() as any;
    res.json = jest.fn().mockReturnThis() as any;
    res.send = jest.fn().mockReturnThis() as any;
    return res;
  };
  
  const mockNext = () => jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should return 201 for successful create', async () => {
      const mockTask = {
        id: VALID_UUID,
        title: 'Test Task',
        description: null,
        status: 'TODO' as const,
        scheduledDate: '2024-01-15T10:00:00.000Z',
        tags: [],
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      };
      
      (TaskService.createTask as jest.MockedFunction<typeof TaskService.createTask>).mockResolvedValue(mockTask as any);
      
      const req = mockRequest({}, { title: 'Test Task', scheduledDate: '2024-01-15T10:00:00Z' });
      const res = mockResponse();
      const next = mockNext();
      
      await TaskController.createTask(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    it('should catch service errors and pass to error handler', async () => {
      const error = new ValidationError({ title: 'Title is required' });
      (TaskService.createTask as jest.MockedFunction<typeof TaskService.createTask>).mockRejectedValue(error);
      
      const req = mockRequest({}, {});
      const res = mockResponse();
      const next = mockNext();
      
      await TaskController.createTask(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTaskById', () => {
    it('should return task when found', async () => {
      const mockTask = {
        id: VALID_UUID,
        title: 'Test Task',
        description: null,
        status: 'TODO' as const,
        scheduledDate: '2024-01-15T10:00:00.000Z',
        tags: [],
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      };
      
      (TaskService.getTaskById as jest.MockedFunction<typeof TaskService.getTaskById>).mockResolvedValue(mockTask as any);
      
      const req = mockRequest({ id: VALID_UUID });
      const res = mockResponse();
      const next = mockNext();
      
      await TaskController.getTaskById(req, res, next);
      
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    it('should return 404 when task not found', async () => {
      const error = new NotFoundError();
      (TaskService.getTaskById as jest.MockedFunction<typeof TaskService.getTaskById>).mockRejectedValue(error);
      
      const req = mockRequest({ id: NON_EXISTENT_UUID });
      const res = mockResponse();
      const next = mockNext();
      
      await TaskController.getTaskById(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should return 400 for invalid UUID format', async () => {
      const req = mockRequest({ id: 'invalid-id' });
      const res = mockResponse();
      const next = mockNext();
      
      await TaskController.getTaskById(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(InvalidIdError));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        code: 'INVALID_ID',
        statusCode: 400,
      }));
    });
  });

  it('should return 200 for successful update', async () => {
    const mockTask = {
      id: VALID_UUID,
      title: 'Updated Task',
      description: 'Updated',
      status: 'IN_PROGRESS' as const,
      scheduledDate: '2024-02-15T10:00:00.000Z',
      tags: ['updated'],
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-02-15T10:00:00.000Z',
    };
    
    (TaskService.updateTask as jest.MockedFunction<typeof TaskService.updateTask>).mockResolvedValue(mockTask as any);
    
    const req = mockRequest(
      { id: VALID_UUID },
      { title: 'Updated Task', description: 'Updated', status: 'IN_PROGRESS', scheduledDate: '2024-02-15T10:00:00Z', tags: ['updated'] }
    );
    const res = mockResponse();
    const next = mockNext();
    
    await TaskController.updateTask(req, res, next);
    
    expect(res.json).toHaveBeenCalledWith(mockTask);
  });

  it('should return 204 for successful delete', async () => {
    (TaskService.deleteTask as jest.MockedFunction<typeof TaskService.deleteTask>).mockResolvedValue(undefined);
    
    const req = mockRequest({ id: VALID_UUID });
    const res = mockResponse();
    const next = mockNext();
    
    await TaskController.deleteTask(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
