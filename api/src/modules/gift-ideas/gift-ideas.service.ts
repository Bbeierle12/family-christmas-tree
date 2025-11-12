import { GiftIdea, Comment } from '@prisma/client';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '@/shared/errors';
import { CreateGiftIdeaInput, UpdateGiftIdeaInput } from './gift-ideas.schema';

export class GiftIdeasService {
  /**
   * List gift ideas for a person
   */
  async listGiftIdeas(
    personId: string,
    userId: string,
    filters?: {
      status?: string;
      priority?: string;
      minPrice?: string;
      maxPrice?: string;
    }
  ): Promise<
    Array<
      GiftIdea & {
        person: { id: string; name: string };
        purchaser: { id: string; displayName: string } | null;
        _count: { comments: number };
      }
    >
  > {
    // Verify person access
    await this.checkPersonAccess(personId, userId);

    const where: any = { personId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = parseInt(filters.priority);
    }

    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) {
        where.price.gte = parseFloat(filters.minPrice);
      }
      if (filters.maxPrice) {
        where.price.lte = parseFloat(filters.maxPrice);
      }
    }

    const giftIdeas = await prisma.giftIdea.findMany({
      where,
      include: {
        person: {
          select: {
            id: true,
            name: true,
          },
        },
        purchaser: {
          select: {
            id: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // High priority first
        { createdAt: 'desc' },
      ],
    });

    return giftIdeas as any;
  }

  /**
   * Get gift idea by ID
   */
  async getGiftIdeaById(
    giftIdeaId: string,
    userId: string
  ): Promise<
    GiftIdea & {
      person: { id: string; name: string; giftMapId: string };
      creator: { id: string; displayName: string } | null;
      purchaser: { id: string; displayName: string } | null;
      _count: { comments: number };
    }
  > {
    const giftIdea = await prisma.giftIdea.findUnique({
      where: { id: giftIdeaId },
      include: {
        person: {
          select: {
            id: true,
            name: true,
            giftMapId: true,
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
          },
        },
        purchaser: {
          select: {
            id: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!giftIdea) {
      throw new NotFoundError('Gift idea not found');
    }

    // Verify person access
    await this.checkPersonAccess(giftIdea.personId, userId);

    return giftIdea as any;
  }

  /**
   * Get gift idea with comments
   */
  async getGiftIdeaWithComments(
    giftIdeaId: string,
    userId: string
  ): Promise<GiftIdea & { comments: Array<Comment & { user: any }> }> {
    const giftIdea = await prisma.giftIdea.findUnique({
      where: { id: giftIdeaId },
      include: {
        comments: {
          where: {
            isDeleted: false,
          },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!giftIdea) {
      throw new NotFoundError('Gift idea not found');
    }

    // Verify person access
    await this.checkPersonAccess(giftIdea.personId, userId);

    return giftIdea as any;
  }

  /**
   * Create a new gift idea
   */
  async createGiftIdea(
    personId: string,
    userId: string,
    data: CreateGiftIdeaInput
  ): Promise<GiftIdea> {
    // Verify person access and permission
    await this.checkPersonPermission(personId, userId, 'editor');

    const giftIdea = await prisma.giftIdea.create({
      data: {
        personId,
        title: data.title,
        description: data.description,
        notes: data.notes,
        url: data.url,
        price: data.price,
        currency: data.currency,
        priority: data.priority ?? 0,
        imageUrl: data.imageUrl,
        positionX: data.positionX ?? 0,
        positionY: data.positionY ?? 0,
        status: 'idea',
        createdBy: userId,
      },
    });

    logger.info(
      `Gift idea created: ${giftIdea.title} (${giftIdea.id}) for person ${personId}`
    );

    return giftIdea;
  }

  /**
   * Update gift idea
   */
  async updateGiftIdea(
    giftIdeaId: string,
    userId: string,
    data: UpdateGiftIdeaInput
  ): Promise<GiftIdea> {
    const giftIdea = await prisma.giftIdea.findUnique({
      where: { id: giftIdeaId },
    });

    if (!giftIdea) {
      throw new NotFoundError('Gift idea not found');
    }

    // Verify person permission
    await this.checkPersonPermission(giftIdea.personId, userId, 'editor');

    const updated = await prisma.giftIdea.update({
      where: { id: giftIdeaId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.currency && { currency: data.currency }),
        ...(data.status && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.positionX !== undefined && { positionX: data.positionX }),
        ...(data.positionY !== undefined && { positionY: data.positionY }),
        updatedAt: new Date(),
      },
    });

    logger.info(`Gift idea updated: ${updated.title} (${updated.id})`);

    return updated;
  }

  /**
   * Delete gift idea
   */
  async deleteGiftIdea(giftIdeaId: string, userId: string): Promise<void> {
    const giftIdea = await prisma.giftIdea.findUnique({
      where: { id: giftIdeaId },
    });

    if (!giftIdea) {
      throw new NotFoundError('Gift idea not found');
    }

    // Verify person permission
    await this.checkPersonPermission(giftIdea.personId, userId, 'editor');

    // Delete gift idea and all related data (cascade)
    await prisma.giftIdea.delete({
      where: { id: giftIdeaId },
    });

    logger.info(`Gift idea deleted: ${giftIdeaId}`);
  }

  /**
   * Mark gift idea as purchased
   */
  async purchaseGiftIdea(
    giftIdeaId: string,
    userId: string
  ): Promise<GiftIdea> {
    const giftIdea = await prisma.giftIdea.findUnique({
      where: { id: giftIdeaId },
    });

    if (!giftIdea) {
      throw new NotFoundError('Gift idea not found');
    }

    // Verify person permission
    await this.checkPersonPermission(giftIdea.personId, userId, 'editor');

    if (giftIdea.status === 'purchased') {
      throw new BadRequestError('Gift idea is already marked as purchased');
    }

    const updated = await prisma.giftIdea.update({
      where: { id: giftIdeaId },
      data: {
        status: 'purchased',
        purchasedAt: new Date(),
        purchasedBy: userId,
        updatedAt: new Date(),
      },
    });

    logger.info(`Gift idea purchased: ${updated.title} (${updated.id}) by user ${userId}`);

    return updated;
  }

  /**
   * Mark gift idea as unpurchased
   */
  async unpurchaseGiftIdea(
    giftIdeaId: string,
    userId: string
  ): Promise<GiftIdea> {
    const giftIdea = await prisma.giftIdea.findUnique({
      where: { id: giftIdeaId },
    });

    if (!giftIdea) {
      throw new NotFoundError('Gift idea not found');
    }

    // Verify person permission
    await this.checkPersonPermission(giftIdea.personId, userId, 'editor');

    if (giftIdea.status !== 'purchased') {
      throw new BadRequestError('Gift idea is not marked as purchased');
    }

    const updated = await prisma.giftIdea.update({
      where: { id: giftIdeaId },
      data: {
        status: 'idea',
        purchasedAt: null,
        purchasedBy: null,
        updatedAt: new Date(),
      },
    });

    logger.info(`Gift idea unpurchased: ${updated.title} (${updated.id})`);

    return updated;
  }

  /**
   * Check person access
   */
  private async checkPersonAccess(
    personId: string,
    userId: string
  ): Promise<void> {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        giftMap: {
          include: {
            workspace: {
              include: {
                members: {
                  where: {
                    userId,
                    status: 'active',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!person) {
      throw new NotFoundError('Person not found');
    }

    if (person.giftMap.workspace.members.length === 0) {
      throw new ForbiddenError('Not a member of this workspace');
    }
  }

  /**
   * Check person permission
   */
  private async checkPersonPermission(
    personId: string,
    userId: string,
    requiredRole: 'owner' | 'editor' | 'viewer'
  ): Promise<void> {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        giftMap: {
          include: {
            workspace: {
              include: {
                members: {
                  where: {
                    userId,
                    status: 'active',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!person) {
      throw new NotFoundError('Person not found');
    }

    const member = person.giftMap.workspace.members[0];

    if (!member) {
      throw new ForbiddenError('Not a member of this workspace');
    }

    const roleHierarchy = { owner: 3, editor: 2, viewer: 1 };
    const userRoleLevel =
      roleHierarchy[member.role as keyof typeof roleHierarchy];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      throw new ForbiddenError(`Requires ${requiredRole} role`);
    }
  }
}
