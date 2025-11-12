import { z } from 'zod';

/**
 * Create person schema
 */
export const CreatePersonSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters'),
    interests: z
      .string()
      .max(500, 'Interests must be less than 500 characters')
      .optional(),
    ageGroup: z
      .enum(['child', 'teen', 'adult', 'senior'])
      .optional(),
    relationship: z
      .string()
      .max(50, 'Relationship must be less than 50 characters')
      .optional(),
    budgetMin: z
      .number()
      .min(0, 'Budget minimum must be positive')
      .optional(),
    budgetMax: z
      .number()
      .min(0, 'Budget maximum must be positive')
      .optional(),
    notes: z
      .string()
      .max(1000, 'Notes must be less than 1000 characters')
      .optional(),
    positionX: z.number().default(0),
    positionY: z.number().default(0),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
      .optional(),
  }).refine(
    (data) => {
      if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
        return data.budgetMax >= data.budgetMin;
      }
      return true;
    },
    {
      message: 'Budget maximum must be greater than or equal to budget minimum',
      path: ['budgetMax'],
    }
  ),
  params: z.object({
    mapId: z.string().uuid('Invalid gift map ID'),
  }),
});

export type CreatePersonInput = z.infer<typeof CreatePersonSchema>['body'];

/**
 * Update person schema
 */
export const UpdatePersonSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    interests: z.string().max(500).optional().nullable(),
    ageGroup: z.enum(['child', 'teen', 'adult', 'senior']).optional().nullable(),
    relationship: z.string().max(50).optional().nullable(),
    budgetMin: z.number().min(0).optional().nullable(),
    budgetMax: z.number().min(0).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    positionX: z.number().optional(),
    positionY: z.number().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().nullable(),
  }).refine(
    (data) => {
      if (data.budgetMin !== undefined && data.budgetMax !== undefined &&
          data.budgetMin !== null && data.budgetMax !== null) {
        return data.budgetMax >= data.budgetMin;
      }
      return true;
    },
    {
      message: 'Budget maximum must be greater than or equal to budget minimum',
      path: ['budgetMax'],
    }
  ),
  params: z.object({
    id: z.string().uuid('Invalid person ID'),
  }),
});

export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>['body'];

/**
 * Person ID param schema
 */
export const PersonParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid person ID'),
  }),
});

/**
 * Gift map ID param schema
 */
export const MapIdParamsSchema = z.object({
  params: z.object({
    mapId: z.string().uuid('Invalid gift map ID'),
  }),
});
