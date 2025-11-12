import { Workspace, WorkspaceMember, User } from '@prisma/client';
import { prisma } from '@/config/database';
import { cache } from '@/config/redis';
import { logger } from '@/config/logger';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '@/shared/errors';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  InviteMemberInput,
  UpdateMemberRoleInput,
} from './workspaces.schema';

export class WorkspacesService {
  /**
   * Get all workspaces for a user
   */
  async getUserWorkspaces(userId: string): Promise<
    Array<
      Workspace & {
        _count: { members: number; giftMaps: number };
        members: Array<{ role: string; status: string }>;
      }
    >
  > {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
            status: 'active',
          },
        },
        isArchived: false,
      },
      include: {
        _count: {
          select: {
            members: true,
            giftMaps: true,
          },
        },
        members: {
          where: { userId },
          select: { role: true, status: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return workspaces as any;
  }

  /**
   * Get workspace by ID
   */
  async getWorkspaceById(
    workspaceId: string,
    userId: string
  ): Promise<
    Workspace & {
      owner: Pick<User, 'id' | 'displayName' | 'email' | 'avatarUrl'>;
      _count: { members: number; giftMaps: number };
      currentUserRole?: string;
    }
  > {
    // Check if user is a member
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

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
            giftMaps: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    if (workspace.isArchived) {
      throw new NotFoundError('Workspace is archived');
    }

    return {
      ...workspace,
      currentUserRole: member.role,
    };
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(
    userId: string,
    data: CreateWorkspaceInput
  ): Promise<Workspace> {
    // Generate unique slug
    const slug = await this.generateUniqueSlug(data.name);

    // Create workspace and add user as owner in transaction
    const workspace = await prisma.$transaction(async (tx) => {
      const newWorkspace = await tx.workspace.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          ownerId: userId,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: newWorkspace.id,
          userId,
          role: 'owner',
          status: 'active',
          joinedAt: new Date(),
        },
      });

      return newWorkspace;
    });

    logger.info(`Workspace created: ${workspace.name} (${workspace.id})`);

    return workspace;
  }

  /**
   * Update workspace
   */
  async updateWorkspace(
    workspaceId: string,
    userId: string,
    data: UpdateWorkspaceInput
  ): Promise<Workspace> {
    // Check if user is owner or editor
    await this.checkWorkspacePermission(workspaceId, userId, 'editor');

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.settings && { settings: data.settings }),
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    await cache.del(`workspace:${workspaceId}`);

    logger.info(`Workspace updated: ${workspace.name} (${workspace.id})`);

    return workspace;
  }

  /**
   * Delete (archive) workspace
   */
  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    // Only owner can delete
    await this.checkWorkspacePermission(workspaceId, userId, 'owner');

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        isArchived: true,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    await cache.delPattern(`workspace:${workspaceId}:*`);

    logger.info(`Workspace archived: ${workspaceId}`);
  }

  /**
   * Get workspace members
   */
  async getWorkspaceMembers(
    workspaceId: string,
    userId: string
  ): Promise<
    Array<
      WorkspaceMember & {
        user: Pick<User, 'id' | 'displayName' | 'email' | 'avatarUrl'>;
        inviter?: Pick<User, 'id' | 'displayName'> | null;
      }
    >
  > {
    // Check if user is a member
    await this.checkWorkspacePermission(workspaceId, userId, 'viewer');

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        inviter: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'desc' }],
    });

    return members as any;
  }

  /**
   * Invite member to workspace
   */
  async inviteMember(
    workspaceId: string,
    inviterId: string,
    data: InviteMemberInput
  ): Promise<WorkspaceMember> {
    // Only owner or editor can invite
    await this.checkWorkspacePermission(workspaceId, inviterId, 'editor');

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundError('User not found with that email');
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
      },
    });

    if (existingMember) {
      if (existingMember.status === 'active') {
        throw new ConflictError('User is already a member of this workspace');
      }
      if (existingMember.status === 'pending') {
        throw new ConflictError('User already has a pending invitation');
      }
    }

    // Create invitation
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: data.role,
        invitedBy: inviterId,
        status: 'pending',
      },
    });

    // TODO: Send email notification

    logger.info(
      `Member invited to workspace ${workspaceId}: ${user.email} as ${data.role}`
    );

    return member;
  }

  /**
   * Respond to workspace invitation
   */
  async respondToInvitation(
    workspaceId: string,
    userId: string,
    accept: boolean
  ): Promise<void> {
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        status: 'pending',
      },
    });

    if (!member) {
      throw new NotFoundError('No pending invitation found');
    }

    if (accept) {
      await prisma.workspaceMember.update({
        where: { id: member.id },
        data: {
          status: 'active',
          joinedAt: new Date(),
        },
      });

      logger.info(`User ${userId} accepted invitation to workspace ${workspaceId}`);
    } else {
      await prisma.workspaceMember.update({
        where: { id: member.id },
        data: {
          status: 'declined',
        },
      });

      logger.info(`User ${userId} declined invitation to workspace ${workspaceId}`);
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    requesterId: string,
    data: UpdateMemberRoleInput
  ): Promise<WorkspaceMember> {
    // Only owner can change roles
    await this.checkWorkspacePermission(workspaceId, requesterId, 'owner');

    // Cannot change your own role
    if (targetUserId === requesterId) {
      throw new BadRequestError('Cannot change your own role');
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: targetUserId,
        status: 'active',
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: member.id },
      data: { role: data.role },
    });

    logger.info(
      `Member role updated in workspace ${workspaceId}: ${targetUserId} -> ${data.role}`
    );

    return updatedMember;
  }

  /**
   * Remove member from workspace
   */
  async removeMember(
    workspaceId: string,
    targetUserId: string,
    requesterId: string
  ): Promise<void> {
    // Check permissions (owner or editor can remove, or user can leave)
    const isSelfLeaving = targetUserId === requesterId;

    if (!isSelfLeaving) {
      await this.checkWorkspacePermission(workspaceId, requesterId, 'editor');
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    // Cannot remove workspace owner
    if (workspace.ownerId === targetUserId) {
      throw new BadRequestError('Cannot remove workspace owner');
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: targetUserId,
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found');
    }

    await prisma.workspaceMember.delete({
      where: { id: member.id },
    });

    logger.info(`Member removed from workspace ${workspaceId}: ${targetUserId}`);
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
    const userRoleLevel = roleHierarchy[member.role as keyof typeof roleHierarchy];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      throw new ForbiddenError(`Requires ${requiredRole} role`);
    }
  }

  /**
   * Generate unique workspace slug
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await prisma.workspace.findUnique({
        where: { slug },
      });

      if (!existing) {
        return slug;
      }

      slug = `${base}-${counter}`;
      counter++;
    }
  }
}
