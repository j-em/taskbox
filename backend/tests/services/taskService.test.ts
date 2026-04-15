import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { TaskService } from '../../src/services/taskService';
import { prisma } from '../setup';
import { NotFoundError } from '../../src/utils/errors';

describe('TaskService.createTask()', () => {
  it('should create a task with valid title and scheduledDate', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'Test Description',
      status: 'TODO' as const,
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: ['urgent', 'work'],
    };

    const task = await TaskService.createTask(taskData);

    expect(task).toHaveProperty('id');
    expect(task.title).toBe(taskData.title);
    expect(task.description).toBe(taskData.description);
    expect(task.status).toBe(taskData.status);
    expect(task.tags).toEqual(['urgent', 'work']);
    expect(task).toHaveProperty('createdAt');
    expect(task).toHaveProperty('updatedAt');

    // Verify task was stored in database
    const storedTask = await prisma.task.findUnique({ where: { id: task.id } });
    expect(storedTask).not.toBeNull();
    expect(storedTask?.title).toBe(taskData.title);
  });

  it('should normalize tags to lowercase and remove duplicates', async () => {
    const taskData = {
      title: 'Task with mixed case tags',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: ['URGENT', 'Work', 'urgent', 'WORK', 'personal'],
    };

    const task = await TaskService.createTask(taskData);

    // Should be lowercase and duplicates removed, preserving first occurrence order
    expect(task.tags).toEqual(['urgent', 'work', 'personal']);
  });

  it('should convert scheduledDate to UTC before storage', async () => {
    const taskData = {
      title: 'Task with timezone',
      scheduledDate: '2024-01-15T12:00:00+02:00', // 2 PM in UTC+2 = 12 PM UTC
    };

    const task = await TaskService.createTask(taskData);

    // The scheduledDate should be converted to UTC
    expect(task.scheduledDate).toBe('2024-01-15T10:00:00.000Z');
  });
});

describe('TaskService.getTaskById()', () => {
  it('should return task when ID exists', async () => {
    const created = await TaskService.createTask({
      title: 'Test Task',
      scheduledDate: '2024-01-15T10:00:00Z',
    });

    const task = await TaskService.getTaskById(created.id);

    expect(task).toHaveProperty('id', created.id);
    expect(task.title).toBe('Test Task');
  });

  it('should throw NotFoundError when ID does not exist', async () => {
    await expect(TaskService.getTaskById('non-existent-id')).rejects.toThrow(NotFoundError);
  });
});

describe('TaskService.updateTask()', () => {
  it('should replace all fields when given valid full payload', async () => {
    const created = await TaskService.createTask({
      title: 'Original Title',
      description: 'Original Description',
      status: 'TODO',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: ['original'],
    });

    const updateData = {
      title: 'Updated Title',
      description: 'Updated Description',
      status: 'IN_PROGRESS' as const,
      scheduledDate: '2024-02-20T15:00:00Z',
      tags: ['updated', 'new'],
    };

    const updated = await TaskService.updateTask(created.id, updateData);

    expect(updated.title).toBe(updateData.title);
    expect(updated.description).toBe(updateData.description);
    expect(updated.status).toBe(updateData.status);
    expect(updated.scheduledDate).toBe('2024-02-20T15:00:00.000Z');
    expect(updated.tags).toEqual(['updated', 'new']);
    expect(updated.id).toBe(created.id); // ID should remain the same
  });

  it('should throw NotFoundError when updating non-existent task', async () => {
    const updateData = {
      title: 'Updated Title',
      description: 'Updated Description',
      status: 'IN_PROGRESS' as const,
      scheduledDate: '2024-02-20T15:00:00Z',
      tags: ['updated'],
    };

    await expect(TaskService.updateTask('non-existent-id', updateData)).rejects.toThrow(NotFoundError);
  });
});

describe('TaskService.deleteTask()', () => {
  it('should permanently remove task by ID', async () => {
    const created = await TaskService.createTask({
      title: 'Task to Delete',
      scheduledDate: '2024-01-15T10:00:00Z',
    });

    await TaskService.deleteTask(created.id);

    // Verify task no longer exists
    const found = await prisma.task.findUnique({ where: { id: created.id } });
    expect(found).toBeNull();
  });

  it('should throw NotFoundError when deleting non-existent task', async () => {
    await expect(TaskService.deleteTask('non-existent-id')).rejects.toThrow(NotFoundError);
  });
});

describe('TaskService.listTasks() - Filtering', () => {
  beforeEach(async () => {
    // Create test data
    await TaskService.createTask({
      title: 'Urgent Work Task',
      description: 'This is urgent work',
      status: 'TODO',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: ['urgent', 'work'],
    });
    await TaskService.createTask({
      title: 'Personal Task',
      description: 'Personal stuff',
      status: 'IN_PROGRESS',
      scheduledDate: '2024-01-15T14:00:00Z',
      tags: ['personal'],
    });
    await TaskService.createTask({
      title: 'Completed Work',
      description: 'Done work item',
      status: 'DONE',
      scheduledDate: '2024-01-16T10:00:00Z',
      tags: ['work'],
    });
    await TaskService.createTask({
      title: 'Cancelled Item',
      description: 'No longer needed',
      status: 'CANCELLED',
      scheduledDate: '2024-01-15T09:00:00Z',
      tags: ['urgent'],
    });
  });

  it('should filter by status', async () => {
    const result = await TaskService.listTasks({ status: 'TODO' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Urgent Work Task');
    expect(result.pagination.hasMore).toBe(false);
  });

  it('should filter by tag (case-insensitive)', async () => {
    const result = await TaskService.listTasks({ tag: 'WORK' });

    expect(result.data).toHaveLength(2);
    const titles = result.data.map((t: any) => t.title);
    expect(titles).toContain('Urgent Work Task');
    expect(titles).toContain('Completed Work');
  });

  it('should filter by scheduledDate (ignoring time)', async () => {
    const result = await TaskService.listTasks({ scheduledDate: '2024-01-15T00:00:00Z' });

    expect(result.data).toHaveLength(3); // 3 tasks on Jan 15
    const titles = result.data.map((t: any) => t.title);
    expect(titles).toContain('Urgent Work Task');
    expect(titles).toContain('Personal Task');
    expect(titles).toContain('Cancelled Item');
  });

  it('should filter by search (substring match in title/description)', async () => {
    const resultWork = await TaskService.listTasks({ search: 'work' });
    expect(resultWork.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should apply AND logic when multiple filters combined', async () => {
    const result = await TaskService.listTasks({ status: 'TODO', tag: 'urgent' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Urgent Work Task');
  });
});

describe('TaskService.listTasks() - Pagination', () => {
  it('should respect default limit (20) and max limit (100)', async () => {
    // Create 25 tasks
    for (let i = 0; i < 25; i++) {
      await TaskService.createTask({
        title: `Task ${i}`,
        scheduledDate: '2024-01-15T10:00:00Z',
      });
    }

    const result = await TaskService.listTasks({});

    expect(result.data).toHaveLength(20); // Default limit
    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).not.toBeNull();
  });

  it('should return hasMore: false when no more results', async () => {
    // Create 5 tasks
    for (let i = 0; i < 5; i++) {
      await TaskService.createTask({
        title: `Task ${i}`,
        scheduledDate: '2024-01-15T10:00:00Z',
      });
    }

    const result = await TaskService.listTasks({}, {}, { limit: 10 });

    expect(result.data).toHaveLength(5);
    expect(result.pagination.hasMore).toBe(false);
    expect(result.pagination.nextCursor).toBeNull();
  });

  it('should use cursor for pagination', async () => {
    // Create 5 tasks
    for (let i = 0; i < 5; i++) {
      await TaskService.createTask({
        title: `Task ${i}`,
        scheduledDate: '2024-01-15T10:00:00Z',
      });
    }

    const firstPage = await TaskService.listTasks({}, {}, { limit: 2 });
    expect(firstPage.data).toHaveLength(2);
    expect(firstPage.pagination.hasMore).toBe(true);
    expect(firstPage.pagination.nextCursor).not.toBeNull();

    // Get second page using cursor
    const secondPage = await TaskService.listTasks({}, {}, { limit: 2, cursor: firstPage.pagination.nextCursor! });
    expect(secondPage.data).toHaveLength(2);
    expect(secondPage.pagination.hasMore).toBe(true);

    // Get third page
    const thirdPage = await TaskService.listTasks({}, {}, { limit: 2, cursor: secondPage.pagination.nextCursor! });
    expect(thirdPage.data).toHaveLength(1);
    expect(thirdPage.pagination.hasMore).toBe(false);
  });
});
