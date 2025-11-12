import { GiftMap, Person, GiftIdea, Edge } from '@prisma/client';
import { prisma } from '@/config/database';
import { cache } from '@/config/redis';
import { logger } from '@/config/logger';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '@/shared/errors';
import { CreateGiftMapInput, UpdateGiftMapInput } from './gift-maps.schema';

export class GiftMapsService {
  /**
   * List gift maps in a workspace
   */
  async listGiftMaps(
    workspaceId: string,
    userId: string,
    filters?: {
      year?: string;
      occasion?: string;
      archived?: boolean;
    }
  ): Promise<
    Array<
      GiftMap & {
        _count: { people: number; edges: number };
        creator: { id: string; displayName: string } | null;
      }
    >
  > {
    // Verify workspace membership
    await this.checkWorkspaceMembership(workspaceId, userId);

    const where: any = {
      workspaceId,
      isArchived: filters?.archived ?? false,
    };

    if (filters?.year) {
      where.year = parseInt(filters.year);
    }

    if (filters?.occasion) {
      where.occasion = filters.occasion;
    }

    const giftMaps = await prisma.giftMap.findMany({
      where,
      include: {
        _count: {
          select: {
            people: true,
            edges: true,
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return giftMaps as any;
  }

  /**
   * Get gift map by ID
   */
  async getGiftMapById(
    giftMapId: string,
    userId: string
  ): Promise<
    GiftMap & {
      workspace: { id: string; name: string; slug: string };
      creator: { id: string; displayName: string } | null;
      _count: { people: number; edges: number };
    }
  > {
    const giftMap = await prisma.giftMap.findUnique({
      where: { id: giftMapId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            people: true,
            edges: true,
          },
        },
      },
    });

    if (!giftMap) {
      throw new NotFoundError('Gift map not found');
    }

    // Verify workspace membership
    await this.checkWorkspaceMembership(giftMap.workspaceId, userId);

    if (giftMap.isArchived) {
      throw new NotFoundError('Gift map is archived');
    }

    return giftMap as any;
  }

  /**
   * Get full gift map with all related data
   */
  async getGiftMapFull(
    giftMapId: string,
    userId: string
  ): Promise<
    GiftMap & {
      people: Array<Person & { giftIdeas: GiftIdea[] }>;
      edges: Edge[];
    }
  > {
    const giftMap = await prisma.giftMap.findUnique({
      where: { id: giftMapId },
      include: {
        people: {
          include: {
            giftIdeas: true,
          },
        },
        edges: true,
      },
    });

    if (!giftMap) {
      throw new NotFoundError('Gift map not found');
    }

    // Verify workspace membership
    await this.checkWorkspaceMembership(giftMap.workspaceId, userId);

    if (giftMap.isArchived) {
      throw new NotFoundError('Gift map is archived');
    }

    return giftMap as any;
  }

  /**
   * Create a new gift map
   */
  async createGiftMap(
    workspaceId: string,
    userId: string,
    data: CreateGiftMapInput
  ): Promise<GiftMap> {
    // Verify workspace membership and permission
    await this.checkWorkspacePermission(workspaceId, userId, 'editor');

    const giftMap = await prisma.giftMap.create({
      data: {
        workspaceId,
        title: data.title,
        description: data.description,
        year: data.year,
        occasion: data.occasion,
        settings: data.settings || {},
        createdBy: userId,
      },
    });

    logger.info(
      `Gift map created: ${giftMap.title} (${giftMap.id}) in workspace ${workspaceId}`
    );

    return giftMap;
  }

  /**
   * Update gift map
   */
  async updateGiftMap(
    giftMapId: string,
    userId: string,
    data: UpdateGiftMapInput
  ): Promise<GiftMap> {
    const giftMap = await prisma.giftMap.findUnique({
      where: { id: giftMapId },
    });

    if (!giftMap) {
      throw new NotFoundError('Gift map not found');
    }

    // Verify workspace permission
    await this.checkWorkspacePermission(giftMap.workspaceId, userId, 'editor');

    const updated = await prisma.giftMap.update({
      where: { id: giftMapId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.occasion !== undefined && { occasion: data.occasion }),
        ...(data.settings && { settings: data.settings }),
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    await cache.del(`giftmap:${giftMapId}`);

    logger.info(`Gift map updated: ${updated.title} (${updated.id})`);

    return updated;
  }

  /**
   * Delete (archive) gift map
   */
  async deleteGiftMap(giftMapId: string, userId: string): Promise<void> {
    const giftMap = await prisma.giftMap.findUnique({
      where: { id: giftMapId },
    });

    if (!giftMap) {
      throw new NotFoundError('Gift map not found');
    }

    // Verify workspace permission (owner or editor can delete)
    await this.checkWorkspacePermission(giftMap.workspaceId, userId, 'editor');

    await prisma.giftMap.update({
      where: { id: giftMapId },
      data: {
        isArchived: true,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    await cache.delPattern(`giftmap:${giftMapId}:*`);

    logger.info(`Gift map archived: ${giftMapId}`);
  }

  /**
   * Duplicate gift map
   */
  async duplicateGiftMap(
    giftMapId: string,
    userId: string
  ): Promise<GiftMap> {
    const original = await prisma.giftMap.findUnique({
      where: { id: giftMapId },
      include: {
        people: {
          include: {
            giftIdeas: true,
          },
        },
        edges: true,
      },
    });

    if (!original) {
      throw new NotFoundError('Gift map not found');
    }

    // Verify workspace permission
    await this.checkWorkspacePermission(original.workspaceId, userId, 'editor');

    // Create duplicate in a transaction
    const duplicate = await prisma.$transaction(async (tx) => {
      // Create new gift map
      const newMap = await tx.giftMap.create({
        data: {
          workspaceId: original.workspaceId,
          title: `${original.title} (Copy)`,
          description: original.description,
          year: original.year,
          occasion: original.occasion,
          settings: original.settings as any,
          createdBy: userId,
        },
      });

      // Create ID mapping for old -> new
      const personIdMap = new Map<string, string>();

      // Duplicate people
      for (const person of original.people) {
        const newPerson = await tx.person.create({
          data: {
            giftMapId: newMap.id,
            name: person.name,
            interests: person.interests,
            ageGroup: person.ageGroup,
            relationship: person.relationship,
            budgetMin: person.budgetMin,
            budgetMax: person.budgetMax,
            notes: person.notes,
            positionX: person.positionX,
            positionY: person.positionY,
            color: person.color,
            createdBy: userId,
          },
        });

        personIdMap.set(person.id, newPerson.id);

        // Duplicate gift ideas for this person
        for (const idea of person.giftIdeas) {
          await tx.giftIdea.create({
            data: {
              personId: newPerson.id,
              title: idea.title,
              description: idea.description,
              notes: idea.notes,
              url: idea.url,
              price: idea.price,
              currency: idea.currency,
              status: 'idea', // Reset status to 'idea'
              priority: idea.priority,
              imageUrl: idea.imageUrl,
              positionX: idea.positionX,
              positionY: idea.positionY,
              createdBy: userId,
            },
          });
        }
      }

      // Duplicate edges with new IDs
      for (const edge of original.edges) {
        const newSourceId =
          edge.sourceType === 'person'
            ? personIdMap.get(edge.sourceId) || edge.sourceId
            : edge.sourceId;
        const newTargetId =
          edge.targetType === 'person'
            ? personIdMap.get(edge.targetId) || edge.targetId
            : edge.targetId;

        await tx.edge.create({
          data: {
            giftMapId: newMap.id,
            sourceType: edge.sourceType,
            sourceId: newSourceId,
            targetType: edge.targetType,
            targetId: newTargetId,
            label: edge.label,
            style: edge.style as any,
          },
        });
      }

      return newMap;
    });

    logger.info(
      `Gift map duplicated: ${original.id} -> ${duplicate.id}`
    );

    return duplicate;
  }

  /**
   * Get activity log for gift map
   */
  async getGiftMapActivity(
    giftMapId: string,
    userId: string,
    limit: number = 50
  ) {
    const giftMap = await prisma.giftMap.findUnique({
      where: { id: giftMapId },
    });

    if (!giftMap) {
      throw new NotFoundError('Gift map not found');
    }

    // Verify workspace membership
    await this.checkWorkspaceMembership(giftMap.workspaceId, userId);

    const activities = await prisma.activityLog.findMany({
      where: { giftMapId },
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
        createdAt: 'desc',
      },
      take: limit,
    });

    return activities;
  }

  /**
   * Check workspace membership
   */
  private async checkWorkspaceMembership(
    workspaceId: string,
    userId: string
  ): Promise<void> {
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenError('Not a member of this workspace');
    }
  }

  /**
   * Check workspace permission
   */
  private async checkWorkspacePermission(
    workspaceId: string,
    userId: string,
    requiredRole: 'owner' | 'editor' | 'viewer'
  ): Promise<void> {
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        status: 'active',
      },
    });

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
