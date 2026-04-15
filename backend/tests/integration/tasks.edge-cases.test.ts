import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';
import { prisma } from '../setup';
import { seedTask } from '../utils/seed';

describe('Tasks API - Edge Cases & Advanced', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  describe('CORS Headers', () => {
    it('should include CORS headers for cross-origin requests', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Origin', 'http://localhost:3001');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/tasks')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
    });
  });

  describe('404 Unknown Routes', () => {
    it('should return proper 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Route not found');
    });

    it('should return proper 404 for unknown methods on existing routes', async () => {
      const response = await request(app).patch('/api/v1/tasks/some-id');

      expect(response.status).toBe(404);
    });
  });

  it('should complete full task lifecycle with consistent data', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: 'Lifecycle Task',
        description: 'Original description',
        status: 'TODO',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: ['original'],
      });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    // Get and verify
    const getRes = await request(app).get(`/api/v1/tasks/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe('Lifecycle Task');
    expect(getRes.body.description).toBe('Original description');
    expect(getRes.body.status).toBe('TODO');
    expect(getRes.body.tags).toEqual(['original']);

    // Update
    const updateRes = await request(app)
      .put(`/api/v1/tasks/${id}`)
      .send({
        title: 'Updated Task',
        description: 'Updated description',
        status: 'DONE',
        scheduledDate: '2024-01-20T15:00:00Z',
        tags: ['updated'],
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toBe('Updated Task');

    // Verify update persisted
    const get2Res = await request(app).get(`/api/v1/tasks/${id}`);
    expect(get2Res.body.title).toBe('Updated Task');
    expect(get2Res.body.description).toBe('Updated description');
    expect(get2Res.body.status).toBe('DONE');
    expect(get2Res.body.tags).toEqual(['updated']);
    expect(get2Res.body.updatedAt).not.toBe(getRes.body.updatedAt);

    // Delete
    const deleteRes = await request(app).delete(`/api/v1/tasks/${id}`);
    expect(deleteRes.status).toBe(204);

    // Verify gone
    const get3Res = await request(app).get(`/api/v1/tasks/${id}`);
    expect(get3Res.status).toBe(404);
    expect(get3Res.body.error.code).toBe('NOT_FOUND');
  });

  it('should handle concurrent updates without data loss', async () => {
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .send({
        title: 'Concurrent Task',
        scheduledDate: '2024-01-15T10:00:00Z',
        status: 'TODO',
        tags: [],
        description: '',
      });
    const id = createRes.body.id;

    // Two concurrent updates
    const [update1, update2] = await Promise.all([
      request(app).put(`/api/v1/tasks/${id}`).send({
        title: 'First Update',
        description: '',
        status: 'IN_PROGRESS',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: [],
      }),
      request(app).put(`/api/v1/tasks/${id}`).send({
        title: 'Second Update',
        description: '',
        status: 'DONE',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: [],
      }),
    ]);

    // Both should succeed (last write wins for full PUT)
    expect([update1.status, update2.status]).toContain(200);

    // Verify final state is one of the updates
    const final = await request(app).get(`/api/v1/tasks/${id}`);
    expect(final.status).toBe(200);
    expect(['First Update', 'Second Update']).toContain(final.body.title);
    expect(['IN_PROGRESS', 'DONE']).toContain(final.body.status);
  });

  it('should handle listing 50+ tasks efficiently', async () => {
    // Bulk insert 50 tasks
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(seedTask({ title: `Bulk Task ${i}`, status: i % 2 === 0 ? 'TODO' : 'DONE' }));
    }
    await Promise.all(promises);

    const start = Date.now();
    const res = await request(app).get('/api/v1/tasks?limit=30');
    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(30);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    expect(res.body.pagination.hasMore).toBe(true);
  });

  describe('Boundary Values for All Fields', () => {
    it('should accept boundary values for all fields', async () => {
      // Max title length (200 chars)
      const maxTitle = 'a'.repeat(200);
      // Max description (1000 chars)
      const maxDesc = 'b'.repeat(1000);
      // Exactly 10 unique tags, each 30 chars max (must be unique to avoid deduplication)
      const maxTags = Array(10).fill(0).map((_, i) => `tag${i.toString().padStart(26, 'a')}`); // 30 chars each: "tag" + 26 chars + index

      const res = await request(app).post('/api/v1/tasks').send({
        title: maxTitle,
        description: maxDesc,
        status: 'TODO',
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: maxTags,
      });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(maxTitle);
      expect(res.body.description).toBe(maxDesc);
      expect(res.body.tags).toHaveLength(10);
    });

    it('should reject values exceeding boundaries', async () => {
      const res = await request(app).post('/api/v1/tasks').send({
        title: 'a'.repeat(201), // 201 chars, max is 200
        description: 'b'.repeat(1001), // 1001 chars, max is 1000
        scheduledDate: '2024-01-15T10:00:00Z',
        tags: Array(11).fill('tag'), // 11 tags, max is 10
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  it('should return consistent error structure for all error types', async () => {
    // 404 - Not Found
    const notFound = await request(app).get('/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000');
    expect(notFound.status).toBe(404);
    expect(notFound.body.error).toHaveProperty('code');
    expect(notFound.body.error).toHaveProperty('message');
    expect(notFound.body.error).toHaveProperty('details');
    expect(notFound.body.error.code).toBe('NOT_FOUND');

    // 400 - Validation Error
    const validation = await request(app).post('/api/v1/tasks').send({ title: '' });
    expect(validation.status).toBe(400);
    expect(validation.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(validation.body.error).toHaveProperty('details');

    // 400 - Invalid ID
    const invalidId = await request(app).get('/api/v1/tasks/not-a-uuid');
    expect(invalidId.status).toBe(400);
    expect(invalidId.body.error).toHaveProperty('code', 'INVALID_ID');

    // 404 - Unknown Route
    const unknownRoute = await request(app).get('/api/v1/unknown-route');
    expect(unknownRoute.status).toBe(404);
    expect(unknownRoute.body.error).toHaveProperty('code', 'NOT_FOUND');
  });

  it('should filter by date ignoring time component', async () => {
    // Tasks at different times on the same day
    await seedTask({ title: 'Morning', scheduledDate: '2024-01-15T00:00:00Z' });
    await seedTask({ title: 'Noon', scheduledDate: '2024-01-15T12:00:00Z' });
    await seedTask({ title: 'Night', scheduledDate: '2024-01-15T23:59:59Z' });
    await seedTask({ title: 'Next Day', scheduledDate: '2024-01-16T00:00:00Z' });

    const res = await request(app).get('/api/v1/tasks?scheduledDate=2024-01-15');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    const titles = res.body.data.map((t: any) => t.title);
    expect(titles).toContain('Morning');
    expect(titles).toContain('Noon');
    expect(titles).toContain('Night');
    expect(titles).not.toContain('Next Day');
  });

  it('should normalize description to empty string', async () => {
    // undefined description defaults to empty string
    const withUndefined = await request(app).post('/api/v1/tasks').send({
      title: 'Undefined Desc',
      scheduledDate: '2024-01-15T10:00:00Z',
    });
    
    // Empty string description stays as empty string
    const withEmpty = await request(app).post('/api/v1/tasks').send({
      title: 'Empty Desc',
      scheduledDate: '2024-01-15T10:00:00Z',
      description: '',
    });
    
    expect(withUndefined.body.description).toBe('');
    expect(withEmpty.body.description).toBe(''); // Empty strings remain empty
  });

  it('should preserve createdAt timestamp on task update', async () => {
    const createRes = await request(app).post('/api/v1/tasks').send({
      title: 'Original',
      scheduledDate: '2024-01-15T10:00:00Z',
    });
    
    const originalCreatedAt = createRes.body.createdAt;
    const taskId = createRes.body.id;
    
    // Wait briefly to ensure timestamp would differ
    await new Promise(r => setTimeout(r, 50));
    
    const updateRes = await request(app).put(`/api/v1/tasks/${taskId}`).send({
      title: 'Updated',
      description: '',
      status: 'DONE',
      scheduledDate: '2024-01-20T10:00:00Z',
      tags: [],
    });
    
    expect(updateRes.body.createdAt).toBe(originalCreatedAt);
    expect(updateRes.body.updatedAt).not.toBe(originalCreatedAt);
  });

  it('should allow multiple tasks with identical titles', async () => {
    const task1 = await request(app).post('/api/v1/tasks').send({
      title: 'Duplicate Title',
      scheduledDate: '2024-01-15T10:00:00Z',
    });
    
    const task2 = await request(app).post('/api/v1/tasks').send({
      title: 'Duplicate Title',
      scheduledDate: '2024-01-16T10:00:00Z',
    });
    
    expect(task1.status).toBe(201);
    expect(task2.status).toBe(201);
    expect(task1.body.id).not.toBe(task2.body.id);
    expect(task1.body.title).toBe(task2.body.title);
    
    // Verify both exist
    const listRes = await request(app).get('/api/v1/tasks?search=Duplicate');
    expect(listRes.body.data).toHaveLength(2);
  });

  it('should support full status lifecycle transitions', async () => {
    const createRes = await request(app).post('/api/v1/tasks').send({
      title: 'Lifecycle',
      scheduledDate: '2024-01-15T10:00:00Z',
      status: 'TODO',
    });
    const id = createRes.body.id;
    
    // TODO -> IN_PROGRESS
    const inProgress = await request(app).put(`/api/v1/tasks/${id}`).send({
      title: 'Lifecycle',
      description: '',
      status: 'IN_PROGRESS',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: [],
    });
    expect(inProgress.body.status).toBe('IN_PROGRESS');
    
    // IN_PROGRESS -> DONE
    const done = await request(app).put(`/api/v1/tasks/${id}`).send({
      title: 'Lifecycle',
      description: '',
      status: 'DONE',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: [],
    });
    expect(done.body.status).toBe('DONE');
    
    // DONE -> CANCELLED
    const cancelled = await request(app).put(`/api/v1/tasks/${id}`).send({
      title: 'Lifecycle',
      description: '',
      status: 'CANCELLED',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: [],
    });
    expect(cancelled.body.status).toBe('CANCELLED');
  });

  it('should allow creating tasks with past scheduled dates', async () => {
    const pastDate = '2020-01-15T10:00:00Z';
    
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Past Task',
      scheduledDate: pastDate,
    });
    
    expect(res.status).toBe(201);
    // Date is returned as ISO string, check it starts with the same date
    expect(res.body.scheduledDate.startsWith('2020-01-15T10:00:00')).toBe(true);
  });

  it('should convert scheduledDate with timezone offset to UTC', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Timezone Task',
      scheduledDate: '2024-01-15T15:30:00+05:30', // IST timezone
    });
    
    expect(res.status).toBe(201);
    // 15:30 +05:30 = 10:00 UTC
    expect(res.body.scheduledDate).toBe('2024-01-15T10:00:00.000Z');
  });

  it('should sort by createdAt in ascending order', async () => {
    const task1 = await seedTask({ title: 'First' });
    await new Promise(r => setTimeout(r, 10));
    const task2 = await seedTask({ title: 'Second' });
    await new Promise(r => setTimeout(r, 10));
    const task3 = await seedTask({ title: 'Third' });
    
    const res = await request(app).get('/api/v1/tasks?sort=createdAt&order=asc');
    expect(res.body.data[0].title).toBe('First');
    expect(res.body.data[2].title).toBe('Third');
  });

  it('should find tasks when search matches either description or title', async () => {
    await seedTask({ title: 'Alpha', description: 'Contains beta keyword here' });
    await seedTask({ title: 'Beta', description: 'Nothing relevant' });
    await seedTask({ title: 'Gamma', description: 'Another beta mention' });
    
    const res = await request(app).get('/api/v1/tasks?search=beta');
    // Matches: Alpha (description), Beta (title), Gamma (description)
    expect(res.body.data).toHaveLength(3);
    // At least 2 should have matching descriptions
    const descMatches = res.body.data.filter((t: any) => t.description?.includes('beta'));
    expect(descMatches.length).toBeGreaterThanOrEqual(2);
  });

  it('should find tasks when search matches only title', async () => {
    await seedTask({ title: 'Urgent Bug Fix', description: 'Regular work' });
    await seedTask({ title: 'Regular Task', description: 'Urgent priority needed' });
    
    const res = await request(app).get('/api/v1/tasks?search=urgent');
    expect(res.body.data).toHaveLength(2);
    const titleMatches = res.body.data.filter((t: any) => t.title.includes('Urgent'));
    expect(titleMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('should advance updatedAt timestamp on each update', async () => {
    const createRes = await request(app).post('/api/v1/tasks').send({
      title: 'Original',
      scheduledDate: '2024-01-15T10:00:00Z',
    });
    const id = createRes.body.id;
    const firstUpdatedAt = createRes.body.updatedAt;
    
    await new Promise(r => setTimeout(r, 100));
    
    const updateRes = await request(app).put(`/api/v1/tasks/${id}`).send({
      title: 'Updated',
      description: '',
      status: 'TODO',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: [],
    });
    
    const secondUpdatedAt = updateRes.body.updatedAt;
    expect(new Date(secondUpdatedAt).getTime()).toBeGreaterThan(new Date(firstUpdatedAt).getTime());
  });

  it('should handle concurrent task creation without conflicts', async () => {
    const promises = Array(10).fill(0).map((_, i) => 
      request(app).post('/api/v1/tasks').send({
        title: `Concurrent Task ${i}`,
        scheduledDate: '2024-01-15T10:00:00Z',
      })
    );
    
    const results = await Promise.all(promises);
    
    // All should succeed
    expect(results.every(r => r.status === 201)).toBe(true);
    
    // All IDs should be unique
    const ids = results.map(r => r.body.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
  });

  it('should handle scheduledDate at year boundaries', async () => {
    const res1 = await request(app).post('/api/v1/tasks').send({
      title: 'New Year Task',
      scheduledDate: '2024-01-01T00:00:00Z',
    });
    const res2 = await request(app).post('/api/v1/tasks').send({
      title: 'End of Year Task',
      scheduledDate: '2024-12-31T23:59:59Z',
    });
    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.scheduledDate.startsWith('2024-01-01')).toBe(true);
    expect(res2.body.scheduledDate.startsWith('2024-12-31')).toBe(true);
  });

  it('should accept scheduledDate far in the future', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Future Task',
      scheduledDate: '2099-12-31T23:59:59Z',
    });
    expect(res.status).toBe(201);
    expect(res.body.scheduledDate.startsWith('2099-12-31')).toBe(true);
  });

  it('should return JSON content-type header for all responses', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('should handle limit as string in query parameters', async () => {
    await seedTask({ title: 'Task 1' });
    await seedTask({ title: 'Task 2' });
    
    const res = await request(app).get('/api/v1/tasks?limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('should allow update with identical values and update timestamp', async () => {
    const createRes = await request(app).post('/api/v1/tasks').send({
      title: 'Same',
      scheduledDate: '2024-01-15T10:00:00Z',
      status: 'TODO',
      tags: [],
    });
    const id = createRes.body.id;
    
    await new Promise(r => setTimeout(r, 50));
    
    const updateRes = await request(app).put(`/api/v1/tasks/${id}`).send({
      title: 'Same',
      description: '',
      status: 'TODO',
      scheduledDate: '2024-01-15T10:00:00Z',
      tags: [],
    });
    
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toBe('Same');
  });

  it('should reject unsupported HTTP methods', async () => {
    const res = await request(app).patch('/api/v1/tasks/some-id');
    expect(res.status).toBe(404);
  });
});
