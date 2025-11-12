import { describe, it, expect, beforeEach } from 'vitest';
import { GiftIdeasService } from './gift-ideas.service';
import {
  testPrisma,
  createTestUser,
  createTestWorkspace,
  createTestGiftMap,
  createTestPerson,
  createTestGiftIdea,
} from '@/test/setup';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '@/shared/errors/AppError';

describe('GiftIdeasService', () => {
  let giftIdeasService: GiftIdeasService;
  let testUser: any;
  let testWorkspace: any;
  let testGiftMap: any;
  let testPerson: any;

  beforeEach(async () => {
    giftIdeasService = new GiftIdeasService();

    // Create test data hierarchy
    testUser = await createTestUser({
      email: 'giftidea@example.com',
      displayName: 'Gift Idea User',
    });

    testWorkspace = await createTestWorkspace(testUser.id, {
      name: 'Test Workspace',
      slug: 'test-workspace',
    });

    testGiftMap = await createTestGiftMap(
      testWorkspace.id,
      testUser.id,
      {
        title: 'Test Gift Map',
        year: 2024,
        occasion: 'christmas',
      }
    );

    testPerson = await createTestPerson(testGiftMap.id, {
      name: 'Test Person',
      budgetMin: 50,
      budgetMax: 100,
    });
  });

  describe('createGiftIdea', () => {
    it('should create a new gift idea', async () => {
      const giftIdea = await giftIdeasService.createGiftIdea(
        testPerson.id,
        testUser.id,
        {
          title: 'New Gift Idea',
          description: 'A great gift',
          price: 75,
          currency: 'USD',
          priority: 1,
          url: 'https://example.com/product',
        }
      );

      expect(giftIdea).toBeDefined();
      expect(giftIdea.title).toBe('New Gift Idea');
      expect(giftIdea.description).toBe('A great gift');
      expect(giftIdea.price).toBe(75);
      expect(giftIdea.priority).toBe(1);
      expect(giftIdea.status).toBe('idea');
      expect(giftIdea.createdBy).toBe(testUser.id);
    });

    it('should throw error if person not found', async () => {
      await expect(
        giftIdeasService.createGiftIdea(
          'non-existent-id',
          testUser.id,
          {
            title: 'Gift',
          }
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if user has no permission', async () => {
      const otherUser = await createTestUser({
        email: 'other@example.com',
        displayName: 'Other User',
      });

      await expect(
        giftIdeasService.createGiftIdea(
          testPerson.id,
          otherUser.id,
          {
            title: 'Gift',
          }
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('listGiftIdeas', () => {
    beforeEach(async () => {
      // Create multiple gift ideas with different statuses
      await createTestGiftIdea(testPerson.id, testUser.id, {
        title: 'Idea 1',
        price: 25,
        status: 'idea',
      });

      await createTestGiftIdea(testPerson.id, testUser.id, {
        title: 'Idea 2',
        price: 75,
        status: 'considering',
      });

      await createTestGiftIdea(testPerson.id, testUser.id, {
        title: 'Idea 3',
        price: 150,
        status: 'decided',
      });
    });

    it('should list all gift ideas for a person', async () => {
      const ideas = await giftIdeasService.listGiftIdeas(
        testPerson.id,
        testUser.id,
        {}
      );

      expect(ideas.length).toBe(3);
    });

    it('should filter by status', async () => {
      const ideas = await giftIdeasService.listGiftIdeas(
        testPerson.id,
        testUser.id,
        { status: 'considering' }
      );

      expect(ideas.length).toBe(1);
      expect(ideas[0].title).toBe('Idea 2');
    });

    it('should filter by min price', async () => {
      const ideas = await giftIdeasService.listGiftIdeas(
        testPerson.id,
        testUser.id,
        { minPrice: 50 }
      );

      expect(ideas.length).toBe(2);
      expect(ideas.every((i) => (i.price || 0) >= 50)).toBe(true);
    });

    it('should filter by max price', async () => {
      const ideas = await giftIdeasService.listGiftIdeas(
        testPerson.id,
        testUser.id,
        { maxPrice: 100 }
      );

      expect(ideas.length).toBe(2);
      expect(ideas.every((i) => (i.price || 0) <= 100)).toBe(true);
    });

    it('should filter by priority', async () => {
      await testPrisma.giftIdea.updateMany({
        where: { personId: testPerson.id },
        data: { priority: 0 },
      });

      await createTestGiftIdea(testPerson.id, testUser.id, {
        title: 'High Priority',
      });

      await testPrisma.giftIdea.update({
        where: { title: 'High Priority' },
        data: { priority: 1 },
      });

      const ideas = await giftIdeasService.listGiftIdeas(
        testPerson.id,
        testUser.id,
        { priority: 1 }
      );

      expect(ideas.length).toBe(1);
      expect(ideas[0].title).toBe('High Priority');
    });
  });

  describe('getGiftIdeaById', () => {
    it('should return gift idea with aggregated data', async () => {
      const created = await createTestGiftIdea(
        testPerson.id,
        testUser.id,
        {
          title: 'Test Idea',
        }
      );

      const giftIdea = await giftIdeasService.getGiftIdeaById(
        created.id,
        testUser.id
      );

      expect(giftIdea).toBeDefined();
      expect(giftIdea.title).toBe('Test Idea');
      expect(giftIdea.creator).toBeDefined();
      expect(giftIdea.creator.displayName).toBe('Gift Idea User');
      expect(giftIdea._count.comments).toBeDefined();
    });

    it('should throw error if not found', async () => {
      await expect(
        giftIdeasService.getGiftIdeaById('non-existent-id', testUser.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateGiftIdea', () => {
    let giftIdea: any;

    beforeEach(async () => {
      giftIdea = await createTestGiftIdea(
        testPerson.id,
        testUser.id,
        {
          title: 'Original Title',
          price: 50,
          status: 'idea',
        }
      );
    });

    it('should update gift idea fields', async () => {
      const updated = await giftIdeasService.updateGiftIdea(
        giftIdea.id,
        testUser.id,
        {
          title: 'Updated Title',
          price: 75,
          status: 'considering',
          priority: 1,
        }
      );

      expect(updated.title).toBe('Updated Title');
      expect(updated.price).toBe(75);
      expect(updated.status).toBe('considering');
      expect(updated.priority).toBe(1);
    });

    it('should allow partial updates', async () => {
      const updated = await giftIdeasService.updateGiftIdea(
        giftIdea.id,
        testUser.id,
        {
          priority: 1,
        }
      );

      expect(updated.title).toBe('Original Title');
      expect(updated.priority).toBe(1);
    });

    it('should throw error for non-editor users', async () => {
      // Create viewer user
      const viewer = await createTestUser({
        email: 'viewer@example.com',
        displayName: 'Viewer',
      });

      await testPrisma.workspaceMember.create({
        data: {
          workspaceId: testWorkspace.id,
          userId: viewer.id,
          role: 'viewer',
          status: 'active',
        },
      });

      await expect(
        giftIdeasService.updateGiftIdea(
          giftIdea.id,
          viewer.id,
          {
            title: 'Try to update',
          }
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('purchaseGiftIdea', () => {
    let giftIdea: any;

    beforeEach(async () => {
      giftIdea = await createTestGiftIdea(
        testPerson.id,
        testUser.id,
        {
          title: 'Gift to Purchase',
          status: 'decided',
        }
      );
    });

    it('should mark gift idea as purchased', async () => {
      const purchased = await giftIdeasService.purchaseGiftIdea(
        giftIdea.id,
        testUser.id
      );

      expect(purchased.status).toBe('purchased');
      expect(purchased.purchasedBy).toBe(testUser.id);
      expect(purchased.purchasedAt).toBeDefined();
    });

    it('should throw error if already purchased', async () => {
      await giftIdeasService.purchaseGiftIdea(giftIdea.id, testUser.id);

      await expect(
        giftIdeasService.purchaseGiftIdea(giftIdea.id, testUser.id)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('unpurchaseGiftIdea', () => {
    let giftIdea: any;

    beforeEach(async () => {
      giftIdea = await createTestGiftIdea(
        testPerson.id,
        testUser.id,
        {
          title: 'Purchased Gift',
          status: 'idea',
        }
      );

      await giftIdeasService.purchaseGiftIdea(giftIdea.id, testUser.id);
    });

    it('should undo purchase', async () => {
      const unpurchased = await giftIdeasService.unpurchaseGiftIdea(
        giftIdea.id,
        testUser.id
      );

      expect(unpurchased.status).toBe('decided');
      expect(unpurchased.purchasedBy).toBeNull();
      expect(unpurchased.purchasedAt).toBeNull();
    });

    it('should throw error if not purchased', async () => {
      const newIdea = await createTestGiftIdea(
        testPerson.id,
        testUser.id,
        {
          title: 'Not Purchased',
        }
      );

      await expect(
        giftIdeasService.unpurchaseGiftIdea(newIdea.id, testUser.id)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteGiftIdea', () => {
    it('should delete gift idea', async () => {
      const giftIdea = await createTestGiftIdea(
        testPerson.id,
        testUser.id,
        {
          title: 'To Delete',
        }
      );

      await giftIdeasService.deleteGiftIdea(giftIdea.id, testUser.id);

      const deleted = await testPrisma.giftIdea.findUnique({
        where: { id: giftIdea.id },
      });

      expect(deleted).toBeNull();
    });

    it('should throw error for non-editor users', async () => {
      const viewer = await createTestUser({
        email: 'viewer@example.com',
        displayName: 'Viewer',
      });

      await testPrisma.workspaceMember.create({
        data: {
          workspaceId: testWorkspace.id,
          userId: viewer.id,
          role: 'viewer',
          status: 'active',
        },
      });

      const giftIdea = await createTestGiftIdea(
        testPerson.id,
        testUser.id,
        {
          title: 'Protected',
        }
      );

      await expect(
        giftIdeasService.deleteGiftIdea(giftIdea.id, viewer.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
