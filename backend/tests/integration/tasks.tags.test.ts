import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';
import { prisma } from '../setup';
import { seedTask } from '../utils/seed';

describe('Tasks API - Tags & Data Normalization', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  it('should normalize duplicate tags to lowercase and remove duplicates', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: 'Task with duplicate tags',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: ['Work', 'work', 'WORK', 'URGENT', 'urgent'],
      });

    expect(response.status).toBe(201);
    expect(response.body.tags).toEqual(['work', 'urgent']);
  });

  it('should filter tags case-insensitively', async () => {
    // Seed with lowercase tags
    await seedTask({ title: 'Work Task', tags: ['work', 'urgent'] });

    // Search with uppercase tag
    const response = await request(app).get('/api/v1/tasks?tag=WORK');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].tags).toContain('work');
  });

  it('should filter tags case-insensitively while storing lowercase', async () => {
    // Create with uppercase/mixed case tags - stored as lowercase by service
    const create1 = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: 'Work Task 1',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: ['WORK', 'URGENT'],
      });
    expect(create1.body.tags).toEqual(['work', 'urgent']);

    const create2 = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: 'Work Task 2',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: ['work'],
      });
    expect(create2.body.tags).toEqual(['work']);

    // Filter with uppercase
    const res = await request(app).get('/api/v1/tasks?tag=WORK');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);

    // But returned tags are always lowercase
    expect(res.body.data[0].tags).toContain('work');
    expect(res.body.data[1].tags).toContain('work');
  });

  it('should default to empty tags array when field not provided', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'No Tags Field',
      scheduledDate: '2024-01-15T10:00:00Z',
    });
    
    expect(res.status).toBe(201);
    expect(res.body.tags).toEqual([]);
  });

  it('should reject tags with invalid characters', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Invalid Tags',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: ['valid-tag', 'invalid tag with spaces'],
    });
    
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    // Check that at least one of the tags has a validation error
    const detailsKeys = Object.keys(res.body.error.details);
    expect(detailsKeys.some(key => key.startsWith('tags'))).toBe(true);
  });

  it('should accept tags with hyphens and underscores', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Special Tags',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: ['work-item', 'team_a', 'feature-123_test'],
    });
    
    expect(res.status).toBe(201);
    expect(res.body.tags).toEqual(['work-item', 'team_a', 'feature-123_test']);
  });

  it('should handle explicit empty tags array', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Explicit Empty Tags',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: [], // Explicit empty
    });
    
    expect(res.status).toBe(201);
    expect(res.body.tags).toEqual([]);
  });

  it('should normalize lowercase status to uppercase', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Lowercase Status',
      scheduledDate: '2024-01-15T10:00:00Z',
      status: 'done', // lowercase
    });
    
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DONE'); // uppercase
  });

  it('should preserve tag order after deduplication', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Ordered Tags',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: ['urgent', 'WORK', 'urgent', 'work', 'personal'],
    });
    expect(res.status).toBe(201);
    expect(res.body.tags).toEqual(['urgent', 'work', 'personal']);
  });
});
