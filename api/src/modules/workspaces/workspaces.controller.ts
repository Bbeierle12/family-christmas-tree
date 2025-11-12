import { Request, Response, NextFunction } from 'express';
import { WorkspacesService } from './workspaces.service';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  InviteMemberInput,
  UpdateMemberRoleInput,
  RespondToInvitationInput,
} from './workspaces.schema';

export class WorkspacesController {
  private workspacesService: WorkspacesService;

  constructor() {
    this.workspacesService = new WorkspacesService();
  }

  /**
   * GET /api/v1/workspaces
   * Get all workspaces for current user
   */
  listWorkspaces = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const workspaces = await this.workspacesService.getUserWorkspaces(
        req.user.id
      );

      res.json({
        success: true,
        data: { workspaces },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/workspaces/:id
   * Get workspace by ID
   */
  getWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const workspace = await this.workspacesService.getWorkspaceById(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: { workspace },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/workspaces
   * Create a new workspace
   */
  createWorkspace = async (
    req: Request<{}, {}, CreateWorkspaceInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const workspace = await this.workspacesService.createWorkspace(
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: { workspace },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/workspaces/:id
   * Update workspace
   */
  updateWorkspace = async (
    req: Request<{ id: string }, {}, UpdateWorkspaceInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const workspace = await this.workspacesService.updateWorkspace(
        req.params.id,
        req.user.id,
        req.body
      );

      res.json({
        success: true,
        data: { workspace },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/workspaces/:id
   * Delete (archive) workspace
   */
  deleteWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      await this.workspacesService.deleteWorkspace(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Workspace archived successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/workspaces/:id/members
   * Get workspace members
   */
  getMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const members = await this.workspacesService.getWorkspaceMembers(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: { members },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/workspaces/:id/members/invite
   * Invite member to workspace
   */
  inviteMember = async (
    req: Request<{ id: string }, {}, InviteMemberInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const member = await this.workspacesService.inviteMember(
        req.params.id,
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: { member },
        message: 'Invitation sent successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/workspaces/:id/members/respond
   * Respond to workspace invitation
   */
  respondToInvitation = async (
    req: Request<{ id: string }, {}, RespondToInvitationInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      await this.workspacesService.respondToInvitation(
        req.params.id,
        req.user.id,
        req.body.accept
      );

      res.json({
        success: true,
        message: req.body.accept
          ? 'Invitation accepted'
          : 'Invitation declined',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/workspaces/:id/members/:userId
   * Update member role
   */
  updateMemberRole = async (
    req: Request<{ id: string; userId: string }, {}, UpdateMemberRoleInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const member = await this.workspacesService.updateMemberRole(
        req.params.id,
        req.params.userId,
        req.user.id,
        req.body
      );

      res.json({
        success: true,
        data: { member },
        message: 'Member role updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/workspaces/:id/members/:userId
   * Remove member from workspace
   */
  removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      await this.workspacesService.removeMember(
        req.params.id,
        req.params.userId,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
