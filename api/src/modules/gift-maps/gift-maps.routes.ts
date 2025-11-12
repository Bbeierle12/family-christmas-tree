import { Router } from 'express';
import { GiftMapsController } from './gift-maps.controller';
import { requireAuth } from '@/middleware/auth';
import { validate, validateParams, validateQuery } from '@/middleware/validate';
import {
  CreateGiftMapSchema,
  UpdateGiftMapSchema,
  GiftMapParamsSchema,
  WorkspaceIdParamsSchema,
  ListGiftMapsQuerySchema,
} from './gift-maps.schema';

const router = Router();
const giftMapsController = new GiftMapsController();

// All gift map routes require authentication
router.use(requireAuth);

/**
 * Workspace-scoped routes
 */

// GET /api/v1/workspaces/:workspaceId/gift-maps
router.get(
  '/workspaces/:workspaceId/gift-maps',
  validateParams(WorkspaceIdParamsSchema.shape.params),
  validateQuery(ListGiftMapsQuerySchema.shape.query),
  giftMapsController.listGiftMaps
);

// POST /api/v1/workspaces/:workspaceId/gift-maps
router.post(
  '/workspaces/:workspaceId/gift-maps',
  validate(CreateGiftMapSchema),
  giftMapsController.createGiftMap
);

/**
 * Gift map-specific routes
 */

// GET /api/v1/gift-maps/:id
router.get(
  '/gift-maps/:id',
  validateParams(GiftMapParamsSchema.shape.params),
  giftMapsController.getGiftMap
);

// GET /api/v1/gift-maps/:id/full
router.get(
  '/gift-maps/:id/full',
  validateParams(GiftMapParamsSchema.shape.params),
  giftMapsController.getGiftMapFull
);

// PATCH /api/v1/gift-maps/:id
router.patch(
  '/gift-maps/:id',
  validate(UpdateGiftMapSchema),
  giftMapsController.updateGiftMap
);

// DELETE /api/v1/gift-maps/:id
router.delete(
  '/gift-maps/:id',
  validateParams(GiftMapParamsSchema.shape.params),
  giftMapsController.deleteGiftMap
);

// POST /api/v1/gift-maps/:id/duplicate
router.post(
  '/gift-maps/:id/duplicate',
  validateParams(GiftMapParamsSchema.shape.params),
  giftMapsController.duplicateGiftMap
);

// GET /api/v1/gift-maps/:id/activity
router.get(
  '/gift-maps/:id/activity',
  validateParams(GiftMapParamsSchema.shape.params),
  giftMapsController.getActivity
);

export default router;
