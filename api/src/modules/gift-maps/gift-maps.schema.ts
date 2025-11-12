import { z } from 'zod';

/**
 * Create gift map schema
 */
export const CreateGiftMapSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters'),
    description: z
      .string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
    year: z
      .number()
      .int()
      .min(2020)
      .max(2100)
      .optional(),
    occasion: z
      .enum(['christmas', 'birthday', 'anniversary', 'wedding', 'graduation', 'other'])
      .optional(),
    settings: z.record(z.any()).optional(),
  }),
  params: z.object({
    workspaceId: z.string().uuid('Invalid workspace ID'),
  }),
});

export type CreateGiftMapInput = z.infer<typeof CreateGiftMapSchema>['body'];

/**
 * Update gift map schema
 */
export const UpdateGiftMapSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    year: z.number().int().min(2020).max(2100).optional().nullable(),
    occasion: z
      .enum(['christmas', 'birthday', 'anniversary', 'wedding', 'graduation', 'other'])
      .optional()
      .nullable(),
    settings: z.record(z.any()).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid gift map ID'),
  }),
});

export type UpdateGiftMapInput = z.infer<typeof UpdateGiftMapSchema>['body'];

/**
 * Gift map ID param schema
 */
export const GiftMapParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid gift map ID'),
  }),
});

/**
 * Workspace ID param schema
 */
export const WorkspaceIdParamsSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid('Invalid workspace ID'),
  }),
});

/**
 * List gift maps query schema
 */
export const ListGiftMapsQuerySchema = z.object({
  query: z.object({
    year: z.string().optional(),
    occasion: z.string().optional(),
    archived: z.enum(['true', 'false']).optional(),
  }),
});
