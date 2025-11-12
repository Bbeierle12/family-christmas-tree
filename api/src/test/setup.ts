import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Test database client
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://giftmap:password@localhost:5432/gift_map_test',
    },
  },
});

// Setup before all tests
beforeAll(async () => {
  // Connect to test database
  await testPrisma.$connect();
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect from test database
  await testPrisma.$disconnect();
});

// Clean database before each test
beforeEach(async () => {
  // Delete all data in reverse order of dependencies
  await testPrisma.activityLog.deleteMany();
  await testPrisma.edge.deleteMany();
  await testPrisma.giftIdea.deleteMany();
  await testPrisma.person.deleteMany();
  await testPrisma.giftMap.deleteMany();
  await testPrisma.workspaceMember.deleteMany();
  await testPrisma.workspace.deleteMany();
  await testPrisma.session.deleteMany();
  await testPrisma.user.deleteMany();
});

/**
 * Helper to create a test user
 */
export async function createTestUser(data?: {
  email?: string;
  displayName?: string;
  passwordHash?: string;
}) {
  return testPrisma.user.create({
    data: {
      email: data?.email || 'test@example.com',
      displayName: data?.displayName || 'Test User',
      passwordHash: data?.passwordHash || 'hashed_password',
      emailVerified: true,
    },
  });
}

/**
 * Helper to create a test workspace
 */
export async function createTestWorkspace(
  ownerId: string,
  data?: {
    name?: string;
    slug?: string;
  }
) {
  return testPrisma.workspace.create({
    data: {
      name: data?.name || 'Test Workspace',
      slug: data?.slug || 'test-workspace',
      ownerId,
      members: {
        create: {
          userId: ownerId,
          role: 'owner',
          status: 'active',
        },
      },
    },
  });
}

/**
 * Helper to create a test gift map
 */
export async function createTestGiftMap(
  workspaceId: string,
  createdBy: string,
  data?: {
    title?: string;
    year?: number;
    occasion?: string;
  }
) {
  return testPrisma.giftMap.create({
    data: {
      workspaceId,
      title: data?.title || 'Test Gift Map',
      year: data?.year || 2024,
      occasion: data?.occasion || 'christmas',
      createdBy,
    },
  });
}

/**
 * Helper to create a test person
 */
export async function createTestPerson(
  giftMapId: string,
  data?: {
    name?: string;
    budgetMin?: number;
    budgetMax?: number;
  }
) {
  return testPrisma.person.create({
    data: {
      giftMapId,
      name: data?.name || 'Test Person',
      budgetMin: data?.budgetMin,
      budgetMax: data?.budgetMax,
    },
  });
}

/**
 * Helper to create a test gift idea
 */
export async function createTestGiftIdea(
  personId: string,
  createdBy: string,
  data?: {
    title?: string;
    price?: number;
    status?: string;
  }
) {
  return testPrisma.giftIdea.create({
    data: {
      personId,
      title: data?.title || 'Test Gift Idea',
      price: data?.price,
      status: data?.status || 'idea',
      createdBy,
    },
  });
}
