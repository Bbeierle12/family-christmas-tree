import { z } from 'zod';

/**
 * Edge Type Enum
 */
export const EdgeTypeEnum = z.enum(['ROOT', 'PERSON', 'GIFT_IDEA']);
export type EdgeType = z.infer<typeof EdgeTypeEnum>;

/**
 * Create Edge Schema
 * POST /api/v1/gift-maps/:mapId/edges
 */
export const CreateEdgeSchema = z.object({
  params: z.object({
    mapId: z.string().uuid('Invalid gift map ID format'),
  }),
  body: z.object({
    sourceId: z.string().min(1, 'Source ID is required'),
    sourceType: EdgeTypeEnum,
    targetId: z.string().min(1, 'Target ID is required'),
    targetType: EdgeTypeEnum,
    label: z.string().max(100).optional(),
    style: z
      .object({
        color: z.string().optional(),
        strokeWidth: z.number().min(1).max(10).optional(),
        strokeDasharray: z.string().optional(),
        animated: z.boolean().optional(),
      })
      .optional(),
  }),
});

export type CreateEdgeInput = z.infer<typeof CreateEdgeSchema>['body'];

/**
 * Edge Params Schema
 * For GET, DELETE /api/v1/edges/:id
 */
export const EdgeParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid edge ID format'),
  }),
});

/**
 * Map ID Params Schema
 * For GET /api/v1/gift-maps/:mapId/edges
 */
export const MapIdParamsSchema = z.object({
  params: z.object({
    mapId: z.string().uuid('Invalid gift map ID format'),
  }),
});
