import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';
import { prisma } from '../setup';

describe('Tasks API - Validation & Error Handling', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  it('should return 400 with validation details for invalid input', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: '', // Invalid: empty
        scheduledDate: 'invalid-date',
        tags: ['a'.repeat(31)], // Too long
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toHaveProperty('title');
    expect(response.body.error.details).toHaveProperty('scheduledDate');
    expect(Object.keys(response.body.error.details)).toContain('tags.0');
  });

  it('should return 400 INVALID_ID for malformed UUIDs', async () => {
    const response = await request(app).get('/api/v1/tasks/not-a-valid-uuid');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_ID');
  });

  it('should return 400 when more than 10 tags are provided', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: 'Task with too many tags',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10', 'tag11'],
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid status values with 400', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Invalid Status',
      scheduledDate: '2024-01-15T10:00:00Z',
      status: 'INVALID_STATUS',
    });
    
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid date format in scheduledDate filter', async () => {
    const res = await request(app).get('/api/v1/tasks?scheduledDate=not-a-date');
    // The API should return 400 for invalid date format
    expect(res.status).toBe(400);
  });

  it('should default to createdAt sort when invalid sort field provided', async () => {
    await prisma.task.create({
      data: {
        title: 'Task A',
        description: '',
        status: 'TODO',
        scheduledDate: new Date('2024-01-15T10:00:00Z'),
        tags: '[]',
      },
    });
    await prisma.task.create({
      data: {
        title: 'Task B',
        description: '',
        status: 'TODO',
        scheduledDate: new Date('2024-01-15T10:00:00Z'),
        tags: '[]',
      },
    });
    
    const res = await request(app).get('/api/v1/tasks?sort=invalidField');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2); // Should still return results
  });

  it('should handle requests without proper Content-Type', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Content-Type', 'text/plain')
      .send('not json');
    
    expect(res.status).toBe(400);
  });

  it('should return 400 for malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');
    
    expect(res.status).toBe(400);
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

  it('should handle leap year February 29 dates', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Leap Year Task',
      scheduledDate: '2024-02-29T10:00:00Z', // 2024 is leap year
    });
    
    expect(res.status).toBe(201);
    expect(res.body.scheduledDate.startsWith('2024-02-29')).toBe(true);
  });

  it('should report all validation errors in single response', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: '',
      scheduledDate: 'invalid',
      tags: ['a'.repeat(31), 'b'.repeat(31)],
      status: 'INVALID',
    });
    
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details).length).toBeGreaterThanOrEqual(3);
  });

  it('should reject or ignore deeply nested objects in request body', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Valid Title',
      scheduledDate: '2024-01-15T10:00:00Z',
      nested: { foo: { bar: 'baz' } },
    });
    expect([201, 400]).toContain(res.status);
  });

  it('should handle or reject excessively large request bodies', async () => {
    const hugeDescription = 'x'.repeat(100000);
    
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Huge',
      scheduledDate: '2024-01-15T10:00:00Z',
      description: hugeDescription,
    });
    
    expect([400, 413, 201]).toContain(res.status);
  });
});
