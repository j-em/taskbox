import { jest, beforeAll, afterEach, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: './dev.db',
});
const prisma = new PrismaClient({ adapter });

beforeAll(async () => {
  // Clean up database before all tests
  try {
    await prisma.task.deleteMany();
  } catch {
    // Table might not exist yet
  }
});

afterEach(async () => {
  // Clean up database after each test
  try {
    await prisma.task.deleteMany();
  } catch {
    // Table might not exist
  }
});

afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});

// Global test timeout
jest.setTimeout(30000);

// Export for use in tests
export { prisma };
