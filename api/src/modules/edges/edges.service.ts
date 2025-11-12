import { Edge } from '@prisma/client';
import { prisma } from '@/config/database';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '@/shared/errors/AppError';
import { CreateEdgeInput } from './edges.schema';

export class EdgesService {
  /**
   * List all edges in a gift map
   */
  async listEdges(giftMapId: string, userId: string): Promise<Edge[]> {
    // Verify gift map exists and user has access
    const giftMap = await prisma.giftMap.findUnique({
      where: { id: giftMapId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!giftMap) {
      throw new NotFoundError('Gift map not found');
    }

    if (giftMap.workspace.members.length === 0) {
      throw new ForbiddenError(
        'You do not have permission to access this gift map'
      );
    }

    // Get all edges for this gift map
    const edges = await prisma.edge.findMany({
      where: { giftMapId },
      orderBy: { createdAt: 'asc' },
    });

    return edges;
  }

  /**
   * Create a new edge
   */
  async createEdge(
    giftMapId: string,
    userId: string,
    data: CreateEdgeInput
  ): Promise<Edge> {
    // Verify gift map exists and user has editor+ access
    const giftMap = await prisma.giftMap.findUnique({
      where: { id: giftMapId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
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
      throw new ForbiddenError(
        'You do not have permission to access this gift map'
      );
    }

    // Require editor or owner role
    const roleLevel = { viewer: 1, editor: 2, owner: 3 }[member.role];
    if (roleLevel < 2) {
      throw new ForbiddenError(
        'You do not have permission to create edges in this gift map'
      );
    }

    // Validate that source and target nodes exist
    await this.validateNode(data.sourceId, data.sourceType, giftMapId);
    await this.validateNode(data.targetId, data.targetType, giftMapId);

    // Check for duplicate edge
    const existingEdge = await prisma.edge.findFirst({
      where: {
        giftMapId,
        sourceId: data.sourceId,
        sourceType: data.sourceType,
        targetId: data.targetId,
        targetType: data.targetType,
      },
    });

    if (existingEdge) {
      throw new BadRequestError(
        'An edge already exists between these nodes'
      );
    }

    // Create the edge
    const edge = await prisma.edge.create({
      data: {
        giftMapId,
        sourceId: data.sourceId,
        sourceType: data.sourceType,
        targetId: data.targetId,
        targetType: data.targetType,
        label: data.label,
        style: data.style as any, // Prisma Json type
      },
    });

    return edge;
  }

  /**
   * Delete an edge
   */
  async deleteEdge(edgeId: string, userId: string): Promise<void> {
    // Get the edge and verify access
    const edge = await prisma.edge.findUnique({
      where: { id: edgeId },
      include: {
        giftMap: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    if (!edge) {
      throw new NotFoundError('Edge not found');
    }

    const member = edge.giftMap.workspace.members[0];
    if (!member) {
      throw new ForbiddenError('You do not have permission to access this edge');
    }

    // Require editor or owner role
    const roleLevel = { viewer: 1, editor: 2, owner: 3 }[member.role];
    if (roleLevel < 2) {
      throw new ForbiddenError(
        'You do not have permission to delete edges in this gift map'
      );
    }

    // Delete the edge
    await prisma.edge.delete({
      where: { id: edgeId },
    });
  }

  /**
   * Validate that a node exists and belongs to the gift map
   */
  private async validateNode(
    nodeId: string,
    nodeType: string,
    giftMapId: string
  ): Promise<void> {
    if (nodeType === 'ROOT') {
      // ROOT nodes don't need validation - they're virtual
      return;
    }

    if (nodeType === 'PERSON') {
      const person = await prisma.person.findUnique({
        where: { id: nodeId },
      });

      if (!person) {
        throw new BadRequestError(`Person with ID ${nodeId} not found`);
      }

      if (person.giftMapId !== giftMapId) {
        throw new BadRequestError('Person does not belong to this gift map');
      }

      return;
    }

    if (nodeType === 'GIFT_IDEA') {
      const giftIdea = await prisma.giftIdea.findUnique({
        where: { id: nodeId },
        include: { person: true },
      });

      if (!giftIdea) {
        throw new BadRequestError(`Gift idea with ID ${nodeId} not found`);
      }

      if (giftIdea.person.giftMapId !== giftMapId) {
        throw new BadRequestError('Gift idea does not belong to this gift map');
      }

      return;
    }

    throw new BadRequestError(`Invalid node type: ${nodeType}`);
  }
}
