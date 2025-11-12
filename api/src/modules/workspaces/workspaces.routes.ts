import { Router } from 'express';
import { WorkspacesController } from './workspaces.controller';
import { requireAuth } from '@/middleware/auth';
import { validate, validateBody, validateParams } from '@/middleware/validate';
import {
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  RespondToInvitationSchema,
  WorkspaceParamsSchema,
  UserIdParamsSchema,
} from './workspaces.schema';

const router = Router();
const workspacesController = new WorkspacesController();

// All workspace routes require authentication
router.use(requireAuth);

/**
 * Workspace CRUD
 */

// GET /api/v1/workspaces
router.get('/', workspacesController.listWorkspaces);

// POST /api/v1/workspaces
router.post(
  '/',
  validate(CreateWorkspaceSchema),
  workspacesController.createWorkspace
);

// GET /api/v1/workspaces/:id
router.get(
  '/:id',
  validateParams(WorkspaceParamsSchema.shape.params),
  workspacesController.getWorkspace
);

// PATCH /api/v1/workspaces/:id
router.patch(
  '/:id',
  validateParams(WorkspaceParamsSchema.shape.params),
  validate(UpdateWorkspaceSchema),
  workspacesController.updateWorkspace
);

// DELETE /api/v1/workspaces/:id
router.delete(
  '/:id',
  validateParams(WorkspaceParamsSchema.shape.params),
  workspacesController.deleteWorkspace
);

/**
 * Member Management
 */

// GET /api/v1/workspaces/:id/members
router.get(
  '/:id/members',
  validateParams(WorkspaceParamsSchema.shape.params),
  workspacesController.getMembers
);

// POST /api/v1/workspaces/:id/members/invite
router.post(
  '/:id/members/invite',
  validateParams(WorkspaceParamsSchema.shape.params),
  validate(InviteMemberSchema),
  workspacesController.inviteMember
);

// POST /api/v1/workspaces/:id/members/respond
router.post(
  '/:id/members/respond',
  validateParams(WorkspaceParamsSchema.shape.params),
  validate(RespondToInvitationSchema),
  workspacesController.respondToInvitation
);

// PATCH /api/v1/workspaces/:id/members/:userId
router.patch(
  '/:id/members/:userId',
  validateParams(
    WorkspaceParamsSchema.shape.params.merge(UserIdParamsSchema.shape.params)
  ),
  validate(UpdateMemberRoleSchema),
  workspacesController.updateMemberRole
);

// DELETE /api/v1/workspaces/:id/members/:userId
router.delete(
  '/:id/members/:userId',
  validateParams(
    WorkspaceParamsSchema.shape.params.merge(UserIdParamsSchema.shape.params)
  ),
  workspacesController.removeMember
);

export default router;
