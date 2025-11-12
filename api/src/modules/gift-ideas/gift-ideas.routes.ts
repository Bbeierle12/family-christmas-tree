import { Router } from 'express';
import { GiftIdeasController } from './gift-ideas.controller';
import { requireAuth } from '@/middleware/auth';
import { validate, validateParams, validateQuery } from '@/middleware/validate';
import {
  CreateGiftIdeaSchema,
  UpdateGiftIdeaSchema,
  PurchaseGiftIdeaSchema,
  GiftIdeaParamsSchema,
  PersonIdParamsSchema,
  ListGiftIdeasQuerySchema,
} from './gift-ideas.schema';

const router = Router();
const giftIdeasController = new GiftIdeasController();

// All gift idea routes require authentication
router.use(requireAuth);

/**
 * Person-scoped routes
 */

// GET /api/v1/people/:personId/gift-ideas
router.get(
  '/people/:personId/gift-ideas',
  validateParams(PersonIdParamsSchema.shape.params),
  validateQuery(ListGiftIdeasQuerySchema.shape.query),
  giftIdeasController.listGiftIdeas
);

// POST /api/v1/people/:personId/gift-ideas
router.post(
  '/people/:personId/gift-ideas',
  validate(CreateGiftIdeaSchema),
  giftIdeasController.createGiftIdea
);

/**
 * Gift idea-specific routes
 */

// GET /api/v1/gift-ideas/:id
router.get(
  '/gift-ideas/:id',
  validateParams(GiftIdeaParamsSchema.shape.params),
  giftIdeasController.getGiftIdea
);

// GET /api/v1/gift-ideas/:id/comments
router.get(
  '/gift-ideas/:id/comments',
  validateParams(GiftIdeaParamsSchema.shape.params),
  giftIdeasController.getGiftIdeaWithComments
);

// PATCH /api/v1/gift-ideas/:id
router.patch(
  '/gift-ideas/:id',
  validate(UpdateGiftIdeaSchema),
  giftIdeasController.updateGiftIdea
);

// DELETE /api/v1/gift-ideas/:id
router.delete(
  '/gift-ideas/:id',
  validateParams(GiftIdeaParamsSchema.shape.params),
  giftIdeasController.deleteGiftIdea
);

// POST /api/v1/gift-ideas/:id/purchase
router.post(
  '/gift-ideas/:id/purchase',
  validateParams(PurchaseGiftIdeaSchema.shape.params),
  giftIdeasController.purchaseGiftIdea
);

// POST /api/v1/gift-ideas/:id/unpurchase
router.post(
  '/gift-ideas/:id/unpurchase',
  validateParams(PurchaseGiftIdeaSchema.shape.params),
  giftIdeasController.unpurchaseGiftIdea
);

export default router;
