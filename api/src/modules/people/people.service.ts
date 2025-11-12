import { Person, GiftIdea } from '@prisma/client';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import {
  NotFoundError,
  ForbiddenError,
} from '@/shared/errors';
import { CreatePersonInput, UpdatePersonInput } from './people.schema';

export class PeopleService {
  /**
   * List people in a gift map
   */
  async listPeople(
    giftMapId: string,
    userId: string
  ): Promise<
    Array<
      Person & {
        _count: { giftIdeas: number };
        giftIdeas: Array<{ id: string; status: string }>;
      }
    >
  > {
    // Verify gift map access
    await this.checkGiftMapAccess(giftMapId, userId);

    const people = await prisma.person.findMany({
      where: { giftMapId },
      include: {
        _count: {
          select: {
            giftIdeas: true,
          },
        },
        giftIdeas: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return people as any;
  }

  /**
   * Get person by ID
   */
  async getPersonById(
    personId: string,
    userId: string
  ): Promise<
    Person & {
      giftMap: { id: string; title: string };
      _count: { giftIdeas: number };
    }
  > {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        giftMap: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            giftIdeas: true,
          },
        },
      },
    });

    if (!person) {
      throw new NotFoundError('Person not found');
    }

    // Verify gift map access
    await this.checkGiftMapAccess(person.giftMapId, userId);

    return person as any;
  }

  /**
   * Get person with all gift ideas
   */
  async getPersonWithIdeas(
    personId: string,
    userId: string
  ): Promise<Person & { giftIdeas: GiftIdea[] }> {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        giftIdeas: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!person) {
      throw new NotFoundError('Person not found');
    }

    // Verify gift map access
    await this.checkGiftMapAccess(person.giftMapId, userId);

    return person as any;
  }

  /**
   * Create a new person
   */
  async createPerson(
    giftMapId: string,
    userId: string,
    data: CreatePersonInput
  ): Promise<Person> {
    // Verify gift map access and permission
    await this.checkGiftMapPermission(giftMapId, userId, 'editor');

    const person = await prisma.person.create({
      data: {
        giftMapId,
        name: data.name,
        interests: data.interests,
        ageGroup: data.ageGroup,
        relationship: data.relationship,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        notes: data.notes,
        positionX: data.positionX ?? 0,
        positionY: data.positionY ?? 0,
        color: data.color,
        createdBy: userId,
      },
    });

    logger.info(
      `Person created: ${person.name} (${person.id}) in gift map ${giftMapId}`
    );

    return person;
  }

  /**
   * Update person
   */
  async updatePerson(
    personId: string,
    userId: string,
    data: UpdatePersonInput
  ): Promise<Person> {
    const person = await prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new NotFoundError('Person not found');
    }

    // Verify gift map permission
    await this.checkGiftMapPermission(person.giftMapId, userId, 'editor');

    const updated = await prisma.person.update({
      where: { id: personId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.interests !== undefined && { interests: data.interests }),
        ...(data.ageGroup !== undefined && { ageGroup: data.ageGroup }),
        ...(data.relationship !== undefined && { relationship: data.relationship }),
        ...(data.budgetMin !== undefined && { budgetMin: data.budgetMin }),
        ...(data.budgetMax !== undefined && { budgetMax: data.budgetMax }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.positionX !== undefined && { positionX: data.positionX }),
        ...(data.positionY !== undefined && { positionY: data.positionY }),
        ...(data.color !== undefined && { color: data.color }),
        updatedAt: new Date(),
      },
    });

    logger.info(`Person updated: ${updated.name} (${updated.id})`);

    return updated;
  }

  /**
   * Delete person
   */
  async deletePerson(personId: string, userId: string): Promise<void> {
    const person = await prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new NotFoundError('Person not found');
    }

    // Verify gift map permission
    await this.checkGiftMapPermission(person.giftMapId, userId, 'editor');

    // Delete person and all related data (cascade)
    await prisma.person.delete({
      where: { id: personId },
    });

    logger.info(`Person deleted: ${personId}`);
  }

  /**
   * Check gift map access
   */
  private async checkGiftMapAccess(
    giftMapId: string,
    userId: string
  ): Promise<void> {
    const giftMap = await prisma.giftMap.findUnique({
      where: { id: giftMapId },
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
    });

    if (!giftMap) {
      throw new NotFoundError('Gift map not found');
    }

    if (giftMap.workspace.members.length === 0) {
      throw new ForbiddenError('Not a member of this workspace');
    }
  }

  /**
   * Check gift map permission
   */
  private async checkGiftMapPermission(
    giftMapId: string,
    userId: string,
    requiredRole: 'owner' | 'editor' | 'viewer'
  ): Promise<void> {
    const giftMap = await prisma.giftMap.findUnique({
      where: { id: giftMapId },
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
    });

    if (!giftMap) {
      throw new NotFoundError('Gift map not found');
    }

    const member = giftMap.workspace.members[0];

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
