import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';
import { prisma } from '../setup';
import { seedTask } from '../utils/seed';

describe('Tasks API - Pagination', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  describe('Cursor-Based Pagination Returns Correct Pages', () => {
    it('should paginate with cursor and indicate hasMore correctly', async () => {
      // Create 25 tasks
      for (let i = 1; i <= 25; i++) {
        await seedTask({ title: `Task ${i}` });
      }

      // Page 1: limit 10
      const page1 = await request(app).get('/api/v1/tasks?limit=10');
      expect(page1.body.data).toHaveLength(10);
      expect(page1.body.pagination.hasMore).toBe(true);
      expect(page1.body.pagination.nextCursor).toBeTruthy();

      // Page 2: using cursor
      const page2 = await request(app)
        .get(`/api/v1/tasks?limit=10&cursor=${page1.body.pagination.nextCursor}`);
      expect(page2.body.data).toHaveLength(10);
      expect(page2.body.pagination.hasMore).toBe(true);

      // Page 3: last 5
      const page3 = await request(app)
        .get(`/api/v1/tasks?limit=10&cursor=${page2.body.pagination.nextCursor}`);
      expect(page3.body.data).toHaveLength(5);
      expect(page3.body.pagination.hasMore).toBe(false);
      expect(page3.body.pagination.nextCursor).toBeNull();
    });
  });

  describe('Pagination with Filters Persists', () => {
    it('should maintain filters when paginating with cursor', async () => {
      // Create 8 TODO tasks and 4 DONE tasks
      for (let i = 0; i < 8; i++) {
        await seedTask({ status: 'TODO', title: `Todo ${i}` });
      }
      for (let i = 0; i < 4; i++) {
        await seedTask({ status: 'DONE', title: `Done ${i}` });
      }

      // Page 1 with status filter
      const page1 = await request(app).get('/api/v1/tasks?status=TODO&limit=5');
      expect(page1.status).toBe(200);
      expect(page1.body.data).toHaveLength(5);
      expect(page1.body.data.every((t: any) => t.status === 'TODO')).toBe(true);
      expect(page1.body.pagination.hasMore).toBe(true);
      expect(page1.body.pagination.nextCursor).toBeTruthy();

      // Page 2 should still only have TODO
      const page2 = await request(app)
        .get(`/api/v1/tasks?status=TODO&limit=5&cursor=${page1.body.pagination.nextCursor}`);
      expect(page2.status).toBe(200);
      expect(page2.body.data).toHaveLength(3);
      expect(page2.body.data.every((t: any) => t.status === 'TODO')).toBe(true);
      expect(page2.body.pagination.hasMore).toBe(false);
    });
  });

  describe('Empty Task List Returns Valid Paginated Structure', () => {
    it('should return empty data array with hasMore=false when no tasks exist', async () => {
      const res = await request(app).get('/api/v1/tasks');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.hasMore).toBe(false);
      expect(res.body.pagination.nextCursor).toBeNull();
    });
  });

  it('should use default limit of 20 when not provided', async () => {
    // Create 25 tasks
    for (let i = 0; i < 25; i++) {
      await seedTask({ title: `Task ${i}` });
    }
    
    const res = await request(app).get('/api/v1/tasks');
    expect(res.body.data).toHaveLength(20);
    expect(res.body.pagination.hasMore).toBe(true);
  });

  it('should cap limit at 100 even when requesting more', async () => {
    // Bulk insert 110 tasks
    const promises = Array(110).fill(0).map((_, i) => 
      seedTask({ title: `Task ${i}` })
    );
    await Promise.all(promises);
    
    const res = await request(app).get('/api/v1/tasks?limit=200');
    expect(res.body.data.length).toBeLessThanOrEqual(100);
  });

  it('should ignore invalid cursor and return first page', async () => {
    for (let i = 0; i < 15; i++) {
      await seedTask({ title: `Task ${i}` });
    }
    
    const res = await request(app).get('/api/v1/tasks?cursor=invalid-base64!!!');
    expect(res.status).toBe(200);
    // With invalid cursor and default limit of 20, should return all 15 tasks
    expect(res.body.data).toHaveLength(15);
    expect(res.body.pagination.hasMore).toBe(false);
  });

  it('should return exactly 1 task when limit=1', async () => {
    await seedTask({ title: 'Task 1' });
    await seedTask({ title: 'Task 2' });
    
    const res = await request(app).get('/api/v1/tasks?limit=1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.hasMore).toBe(true);
  });

  it('should use default limit when limit=0 provided', async () => {
    for (let i = 0; i < 25; i++) {
      await seedTask({ title: `Task ${i}` });
    }
    
    const res = await request(app).get('/api/v1/tasks?limit=0');
    expect(res.body.data).toHaveLength(20); // Default
  });

  it('should handle pagination when task referenced in cursor is deleted', async () => {
    for (let i = 0; i < 15; i++) {
      await seedTask({ title: `Task ${i}` });
    }
    
    const page1 = await request(app).get('/api/v1/tasks?limit=5');
    const cursor = page1.body.pagination.nextCursor;
    
    // Delete some tasks
    await prisma.task.deleteMany({ where: { title: 'Task 7' } });
    
    const page2 = await request(app).get(`/api/v1/tasks?cursor=${cursor}`);
    expect(page2.status).toBe(200);
  });
});
