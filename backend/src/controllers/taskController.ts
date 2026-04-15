import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TaskService } from '../services/taskService';
import { InvalidIdError } from '../utils/errors';
import { Status, ListTasksFilters, ListTasksSort, ListTasksPagination } from '../types';
import { uuidSchema } from '../middleware/validation';

export class TaskController {
  static async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.createTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = uuidSchema.parse(req.params.id);
      const task = await TaskService.getTaskById(id);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new InvalidIdError());
      } else {
        next(error);
      }
    }
  }

  static async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = uuidSchema.parse(req.params.id);
      const task = await TaskService.updateTask(id, req.body);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new InvalidIdError());
      } else {
        next(error);
      }
    }
  }

  static async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = uuidSchema.parse(req.params.id);
      await TaskService.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new InvalidIdError());
      } else {
        next(error);
      }
    }
  }

  static async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: ListTasksFilters = {};
      if (req.query.scheduledDate) filters.scheduledDate = req.query.scheduledDate as string;
      if (req.query.status) filters.status = req.query.status as Status;
      if (req.query.tag) filters.tag = req.query.tag as string;
      if (req.query.search) filters.search = req.query.search as string;

      const sort: ListTasksSort = {};
      if (req.query.sort) sort.sort = req.query.sort as any;
      if (req.query.order) sort.order = req.query.order as any;

      const pagination: ListTasksPagination = {};
      if (req.query.cursor) pagination.cursor = req.query.cursor as string;
      if (req.query.limit) pagination.limit = parseInt(req.query.limit as string, 10);

      const result = await TaskService.listTasks(filters, sort, pagination);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
