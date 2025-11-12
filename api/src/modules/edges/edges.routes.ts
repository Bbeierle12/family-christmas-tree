import { Router } from 'express';
import { EdgesController } from './edges.controller';
import { requireAuth } from '@/middleware/auth';
import { validate, validateParams } from '@/middleware/validate';
import {
  CreateEdgeSchema,
  EdgeParamsSchema,
  MapIdParamsSchema,
} from './edges.schema';

const router = Router();
const edgesController = new EdgesController();

// All edge routes require authentication
router.use(requireAuth);

/**
 * Gift map-scoped routes
 */

// GET /api/v1/gift-maps/:mapId/edges
router.get(
  '/gift-maps/:mapId/edges',
  validateParams(MapIdParamsSchema.shape.params),
  edgesController.listEdges
);

// POST /api/v1/gift-maps/:mapId/edges
router.post(
  '/gift-maps/:mapId/edges',
  validate(CreateEdgeSchema),
  edgesController.createEdge
);

/**
 * Edge-specific routes
 */

// DELETE /api/v1/edges/:id
router.delete(
  '/edges/:id',
  validateParams(EdgeParamsSchema.shape.params),
  edgesController.deleteEdge
);

export default router;
