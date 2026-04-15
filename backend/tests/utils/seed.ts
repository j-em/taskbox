import { prisma } from '../setup';

/**
 * Helper to seed a task for integration tests.
 * Provides default values that can be overridden per test case.
 */
export async function seedTask(overrides: any = {}) {
  const defaultData = {
    title: 'Test Task',
    description: '',
    status: 'TODO',
    scheduledDate: '2024-01-15T10:00:00Z',
    tags: [],
  };

  const data = { ...defaultData, ...overrides };

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      scheduledDate: new Date(data.scheduledDate),
      tags: JSON.stringify(data.tags.map((t: string) => t.toLowerCase())),
    },
  });

  return task;
}
