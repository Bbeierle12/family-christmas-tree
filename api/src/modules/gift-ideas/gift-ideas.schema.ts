import { z } from 'zod';

/**
 * Create gift idea schema
 */
export const CreateGiftIdeaSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters'),
    description: z
      .string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
    notes: z
      .string()
      .max(1000, 'Notes must be less than 1000 characters')
      .optional(),
    url: z
      .string()
      .url('Must be a valid URL')
      .optional(),
    price: z
      .number()
      .min(0, 'Price must be positive')
      .optional(),
    currency: z
      .string()
      .length(3, 'Currency must be 3-letter code')
      .default('USD'),
    priority: z
      .number()
      .int()
      .min(-1)
      .max(1)
      .default(0), // -1=low, 0=normal, 1=high
    imageUrl: z
      .string()
      .url('Must be a valid URL')
      .optional(),
    positionX: z.number().default(0),
    positionY: z.number().default(0),
  }),
  params: z.object({
    personId: z.string().uuid('Invalid person ID'),
  }),
});

export type CreateGiftIdeaInput = z.infer<typeof CreateGiftIdeaSchema>['body'];

/**
 * Update gift idea schema
 */
export const UpdateGiftIdeaSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    url: z.string().url().optional().nullable(),
    price: z.number().min(0).optional().nullable(),
    currency: z.string().length(3).optional(),
    status: z
      .enum(['idea', 'considering', 'decided', 'purchased', 'wrapped', 'given'])
      .optional(),
    priority: z.number().int().min(-1).max(1).optional(),
    imageUrl: z.string().url().optional().nullable(),
    positionX: z.number().optional(),
    positionY: z.number().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid gift idea ID'),
  }),
});

export type UpdateGiftIdeaInput = z.infer<typeof UpdateGiftIdeaSchema>['body'];

/**
 * Purchase gift idea schema
 */
export const PurchaseGiftIdeaSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid gift idea ID'),
  }),
});

/**
 * Gift idea ID param schema
 */
export const GiftIdeaParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid gift idea ID'),
  }),
});

/**
 * Person ID param schema
 */
export const PersonIdParamsSchema = z.object({
  params: z.object({
    personId: z.string().uuid('Invalid person ID'),
  }),
});

/**
 * List gift ideas query schema
 */
export const ListGiftIdeasQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(),
    priority: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
  }),
});
