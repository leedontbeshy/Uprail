import { prisma } from '../config/database';

/**
 * Global test setup - runs before all tests
 */
beforeAll(async () => {
  // Ensure we're using a test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Tests must use a test database. Set DATABASE_URL to include "test"');
  }
});

/**
 * Clean up after all tests
 */
afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Clear all data between tests to ensure isolation
 */
export async function clearDatabase() {
  const tables = [
    'user_achievements',
    'pomodoro_sessions',
    'tasks',
    'users',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
}
