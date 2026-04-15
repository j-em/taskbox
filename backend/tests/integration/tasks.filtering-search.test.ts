import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';
import { prisma } from '../setup';
import { seedTask } from '../utils/seed';

describe('Tasks API - Filtering, Search & Sort', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  it('should return only tasks matching status filter', async () => {
    // Seed tasks with different statuses
    await seedTask({ title: 'Task 1', status: 'TODO' });
    await seedTask({ title: 'Task 2', status: 'DONE' });
    await seedTask({ title: 'Task 3', status: 'TODO' });

    const response = await request(app).get('/api/v1/tasks?status=TODO');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((t: any) => t.status === 'TODO')).toBe(true);
  });

  it('should search case-insensitively in title and description', async () => {
    await seedTask({ title: 'URGENT: Fix bug', description: 'Critical issue' });
    await seedTask({ title: 'urgent design review', description: 'Weekly sync' });
    await seedTask({ title: 'Low priority', description: 'Not urgent' });

    const response = await request(app).get('/api/v1/tasks?search=URGENT');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('should return only tasks matching the tag filter', async () => {
    // Seed tasks with different tags
    await seedTask({ title: 'Work Task 1', tags: ['work', 'urgent'] });
    await seedTask({ title: 'Personal Task', tags: ['personal'] });
    await seedTask({ title: 'Work Task 2', tags: ['work'] });

    const response = await request(app).get('/api/v1/tasks?tag=work');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((t: any) => t.tags.includes('work'))).toBe(true);
  });

  it('should return only tasks matching the scheduled date filter', async () => {
    // Seed tasks with different dates
    await seedTask({ title: 'Task Today', scheduledDate: '2024-01-15T10:00:00Z' });
    await seedTask({ title: 'Task Yesterday', scheduledDate: '2024-01-14T10:00:00Z' });
    await seedTask({ title: 'Task Today 2', scheduledDate: '2024-01-15T14:30:00Z' });

    const response = await request(app).get('/api/v1/tasks?scheduledDate=2024-01-15');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  describe('Sort Tasks by Different Fields', () => {
    it('should sort tasks by title in ascending order', async () => {
      await seedTask({ title: 'Zebra Task' });
      await seedTask({ title: 'Apple Task' });
      await seedTask({ title: 'Mango Task' });

      const response = await request(app).get('/api/v1/tasks?sort=title&order=asc');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].title).toBe('Apple Task');
      expect(response.body.data[1].title).toBe('Mango Task');
      expect(response.body.data[2].title).toBe('Zebra Task');
    });

    it('should sort tasks by status in descending order', async () => {
      await seedTask({ title: 'Task A', status: 'TODO' });
      await seedTask({ title: 'Task B', status: 'DONE' });
      await seedTask({ title: 'Task C', status: 'IN_PROGRESS' });

      const response = await request(app).get('/api/v1/tasks?sort=status&order=desc');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].status).toBe('TODO');
      expect(response.body.data[1].status).toBe('IN_PROGRESS');
      expect(response.body.data[2].status).toBe('DONE');
    });
  });

  it('should apply multiple filters with AND logic', async () => {
    // Seed: TODO today work, TODO today personal, DONE today work, TODO tomorrow work
    await seedTask({ title: 'TODO Work Today', status: 'TODO', scheduledDate: '2024-01-15T10:00:00Z', tags: ['work'] });
    await seedTask({ title: 'TODO Personal Today', status: 'TODO', scheduledDate: '2024-01-15T14:00:00Z', tags: ['personal'] });
    await seedTask({ title: 'DONE Work Today', status: 'DONE', scheduledDate: '2024-01-15T16:00:00Z', tags: ['work'] });
    await seedTask({ title: 'TODO Work Tomorrow', status: 'TODO', scheduledDate: '2024-01-16T10:00:00Z', tags: ['work'] });

    const res = await request(app)
      .get('/api/v1/tasks?status=TODO&scheduledDate=2024-01-15&tag=work');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('TODO Work Today');
    expect(res.body.data[0].tags).toContain('work');
    expect(res.body.data[0].status).toBe('TODO');
  });

  it('should search tasks with special characters and unicode', async () => {
    await seedTask({ title: 'Task with "quotes" and emoji 🚀', description: 'Regular desc' });
    await seedTask({ title: 'Unicode Task', description: 'Task with unicode: naïve résumé' });
    await seedTask({ title: 'Normal Task', description: 'Nothing special here' });

    const res1 = await request(app).get('/api/v1/tasks?search=emoji');
    expect(res1.status).toBe(200);
    expect(res1.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res1.body.data.some((t: any) => t.title.includes('🚀'))).toBe(true);

    const res2 = await request(app).get('/api/v1/tasks?search=naïve');
    expect(res2.status).toBe(200);
    expect(res2.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res2.body.data.some((t: any) => t.description?.includes('naïve'))).toBe(true);
  });

  it('should return empty array when filtering by non-existent tag', async () => {
    await seedTask({ title: 'Task', tags: ['existing'] });
    
    const res = await request(app).get('/api/v1/tasks?tag=nonexistent');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.hasMore).toBe(false);
  });

  it('should search across title and description simultaneously', async () => {
    await seedTask({ title: 'Alpha Task', description: 'Beta description' });
    await seedTask({ title: 'Beta Task', description: 'Gamma description' });
    await seedTask({ title: 'Gamma Task', description: 'Alpha description' });
    
    // Search for "Alpha" - should match first and third
    const res = await request(app).get('/api/v1/tasks?search=Alpha');
    expect(res.body.data).toHaveLength(2);
  });

  it('should return proper empty response when complex filters match nothing', async () => {
    await seedTask({ 
      title: 'Task A', 
      status: 'TODO', 
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: ['work'] 
    });
    
    // Combine filters that don't match any seeded task
    const res = await request(app).get(
      '/api/v1/tasks?status=DONE&scheduledDate=2024-01-16&tag=personal'
    );
    
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.hasMore).toBe(false);
    expect(res.body.pagination.nextCursor).toBeNull();
  });

  it('should filter status case-insensitively', async () => {
    await seedTask({ title: 'Task 1', status: 'TODO' });
    await seedTask({ title: 'Task 2', status: 'DONE' });
    
    const res = await request(app).get('/api/v1/tasks?status=todo'); // lowercase
    expect(res.status).toBe(200);
    expect(res.body.data.every((t: any) => t.status === 'TODO')).toBe(true);
  });

  it('should accept search with exactly 2 characters', async () => {
    await seedTask({ title: 'Abnormal Task' });
    await seedTask({ title: 'Normal Task' });
    
    const res = await request(app).get('/api/v1/tasks?search=ab'); // exactly 2 chars
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should filter by scheduledDate date portion only', async () => {
    await seedTask({ title: 'Morning', scheduledDate: '2024-01-15T08:00:00Z' });
    await seedTask({ title: 'Evening', scheduledDate: '2024-01-15T20:00:00Z' });
    await seedTask({ title: 'Next Day', scheduledDate: '2024-01-16T10:00:00Z' });
    
    // Query by date only - should match both Jan 15 tasks
    const res = await request(app).get('/api/v1/tasks?scheduledDate=2024-01-15');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const titles = res.body.data.map((t: any) => t.title);
    expect(titles).toContain('Morning');
    expect(titles).toContain('Evening');
    expect(titles).not.toContain('Next Day');
  });

  it('should handle URL-encoded characters in search', async () => {
    await seedTask({ title: 'Task With Spaces', description: 'Regular' });
    
    const res = await request(app).get('/api/v1/tasks?search=Task%20With');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should find task by searching for maximum length title', async () => {
    const maxTitle = 'a'.repeat(200);
    await seedTask({ title: maxTitle });
    
    const res = await request(app).get(`/api/v1/tasks?search=${'a'.repeat(50)}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('should use ID as tiebreaker when scheduledDate values are equal', async () => {
    const date = '2024-01-15T10:00:00Z';
    await seedTask({ title: 'A', scheduledDate: date });
    await seedTask({ title: 'B', scheduledDate: date });
    
    const res = await request(app).get('/api/v1/tasks?sort=scheduledDate&order=asc');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('should handle tag filter with special regex characters safely', async () => {
    await seedTask({ title: 'Task', tags: ['test.item'] });
    
    const res = await request(app).get('/api/v1/tasks?tag=test.item');
    expect(res.status).toBe(200);
  });

  it('should return empty when filters have no overlapping matches', async () => {
    await seedTask({ title: 'Work Task', status: 'TODO', tags: ['work'] });
    await seedTask({ title: 'Personal Done', status: 'DONE', tags: ['personal'] });
    
    const res = await request(app).get('/api/v1/tasks?status=TODO&tag=personal');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('should match search term at any position in text', async () => {
    await seedTask({ title: 'urgent task here', description: 'normal' });
    await seedTask({ title: 'task urgent here', description: 'normal' });
    await seedTask({ title: 'task here urgent', description: 'normal' });
    
    const res = await request(app).get('/api/v1/tasks?search=urgent');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });
});
