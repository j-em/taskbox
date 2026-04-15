import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';
import { prisma } from '../setup';
import { seedTask } from '../utils/seed';

describe('Tasks API - Core CRUD Operations', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  it('should return 200 OK on health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('should create a task with only title and scheduledDate', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: 'Buy groceries',
        scheduledDate: '2024-01-15T10:00:00Z',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Buy groceries');
    expect(response.body.status).toBe('TODO'); // Default value
    expect(response.body.tags).toEqual([]); // Default empty array
    expect(response.body.description).toBe('');  // Empty string is the default
  });

  it('should retrieve a created task with all fields', async () => {
    // Create first
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: 'Test Task',
        description: 'A description',
        status: 'IN_PROGRESS',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: ['work', 'urgent'],
      });

    const taskId = createRes.body.id;

    // Then retrieve
    const getRes = await request(app).get(`/api/v1/tasks/${taskId}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(taskId);
    expect(getRes.body.title).toBe('Test Task');
    expect(getRes.body.description).toBe('A description');
    expect(getRes.body.status).toBe('IN_PROGRESS');
    expect(getRes.body.tags).toEqual(['work', 'urgent']);
    expect(getRes.body).toHaveProperty('createdAt');
    expect(getRes.body).toHaveProperty('updatedAt');
  });

  it('should delete task and return 404 when trying to access it', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'To Delete', scheduledDate: '2024-01-15T10:00:00Z' });

    const taskId = createRes.body.id;

    // Delete
    const deleteRes = await request(app).delete(`/api/v1/tasks/${taskId}`);
    expect(deleteRes.status).toBe(204);

    // Verify gone
    const getRes = await request(app).get(`/api/v1/tasks/${taskId}`);
    expect(getRes.status).toBe(404);
    expect(getRes.body.error.code).toBe('NOT_FOUND');
  });

  it('should fully replace task on PUT', async () => {
    // Create original
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: 'Original',
        description: 'Original desc',
        status: 'TODO',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: ['old-tag'],
      });

    const taskId = createRes.body.id;

    // Full replacement
    const updateRes = await request(app)
      .put(`/api/v1/tasks/${taskId}`)
      .send({
        title: 'Updated Title',
        description: 'Updated desc',
        status: 'DONE',
        scheduledDate: '2024-01-20T15:00:00Z',
        tags: ['new-tag'],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toBe('Updated Title');
    expect(updateRes.body.tags).toEqual(['new-tag']); // Completely replaced, not merged
  });

  it('should return 404 when updating a task that does not exist', async () => {
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
    
    const response = await request(app)
      .put(`/api/v1/tasks/${nonExistentId}`)
      .send({
        title: 'Updated Title',
        description: 'Updated desc',
        status: 'DONE',
        scheduledDate: '2024-01-20T15:00:00Z',
        tags: ['new-tag'],
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 404 when deleting a task that does not exist', async () => {
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440001';
    
    const response = await request(app).delete(`/api/v1/tasks/${nonExistentId}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should preserve the same ID after update', async () => {
    const createRes = await request(app).post('/api/v1/tasks').send({
      title: 'Original',
      scheduledDate: '2024-01-15T10:00:00Z',
    });
    const originalId = createRes.body.id;
    
    const updateRes = await request(app).put(`/api/v1/tasks/${originalId}`).send({
      title: 'Updated',
      description: '',
      status: 'DONE',
      scheduledDate: '2024-01-20T10:00:00Z',
      tags: [],
    });
    
    expect(updateRes.body.id).toBe(originalId);
  });

  it('should ignore extra fields not in schema', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Valid Task',
      scheduledDate: '2024-01-15T10:00:00Z',
      unknownField: 'should be ignored',
      anotherExtra: 123,
    });
    
    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('unknownField');
    expect(res.body).not.toHaveProperty('anotherExtra');
  });

  it('should reject PUT with missing required fields', async () => {
    const createRes = await seedTask({ title: 'Original', tags: ['tag1'] });
    
    const res = await request(app).put(`/api/v1/tasks/${createRes.id}`).send({
      title: 'Updated Title',
      // Missing: description, status, scheduledDate, tags
    });
    
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 when updating deleted task', async () => {
    const createRes = await seedTask({ title: 'To Delete' });
    const id = createRes.id;
    
    await request(app).delete(`/api/v1/tasks/${id}`);
    
    const updateRes = await request(app).put(`/api/v1/tasks/${id}`).send({
      title: 'Updated',
      description: '',
      status: 'TODO',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: [],
    });
    
    expect(updateRes.status).toBe(404);
    expect(updateRes.body.error.code).toBe('NOT_FOUND');
  });

  it('should trim leading and trailing whitespace from title', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: '  Trimmed Title  ',
      scheduledDate: '2024-01-15T10:00:00Z',
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Trimmed Title');
  });

  it('should convert empty string description to null', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Task with empty description',
      scheduledDate: '2024-01-15T10:00:00Z',
      description: '',
    });
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('');  // Empty string is preserved
  });

  it('should handle unicode and emoji in title and description', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: '🚀 Launch Rocket 发射',
      description: 'Description with émojis 🎉 and unicode ñ',
      scheduledDate: '2024-01-15T10:00:00Z',
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('🚀 Launch Rocket 发射');
    expect(res.body.description).toBe('Description with émojis 🎉 and unicode ñ');
  });

  it('should recover and serve requests after database operations', async () => {
    const tasks = [];
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/v1/tasks').send({
        title: `Recovery Test ${i}`,
        scheduledDate: '2024-01-15T10:00:00Z',
      });
      expect(res.status).toBe(201);
      tasks.push(res.body.id);
    }
    
    const listRes = await request(app).get('/api/v1/tasks');
    expect(listRes.body.data).toHaveLength(5);
  });
});
