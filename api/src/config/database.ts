import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Initialize Prisma Client with logging
export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

// Log errors
prisma.$on('error', (e: any) => {
  logger.error('Prisma Error:', e);
});

// Log warnings
prisma.$on('warn', (e: any) => {
  logger.warn('Prisma Warning:', e);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Disconnected from database');
});

// Connection test
export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Connected to PostgreSQL database');

    // Test query
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database health check passed');
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}
