import { z } from 'zod';

/**
 * Create workspace schema
 */
export const CreateWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Workspace name is required')
      .max(100, 'Workspace name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  }),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>['body'];

/**
 * Update workspace schema
 */
export const UpdateWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    settings: z.record(z.any()).optional(),
  }),
});

export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>['body'];

/**
 * Invite member schema
 */
export const InviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['owner', 'editor', 'viewer'], {
      errorMap: () => ({ message: 'Role must be owner, editor, or viewer' }),
    }),
  }),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>['body'];

/**
 * Update member role schema
 */
export const UpdateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['owner', 'editor', 'viewer'], {
      errorMap: () => ({ message: 'Role must be owner, editor, or viewer' }),
    }),
  }),
});

export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>['body'];

/**
 * Respond to invitation schema
 */
export const RespondToInvitationSchema = z.object({
  body: z.object({
    accept: z.boolean(),
  }),
});

export type RespondToInvitationInput = z.infer<typeof RespondToInvitationSchema>['body'];

/**
 * Workspace ID param schema
 */
export const WorkspaceParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid workspace ID'),
  }),
});

/**
 * User ID param schema
 */
export const UserIdParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});
