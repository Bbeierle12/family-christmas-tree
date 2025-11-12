import { Router } from 'express';
import { PeopleController } from './people.controller';
import { requireAuth } from '@/middleware/auth';
import { validate, validateParams } from '@/middleware/validate';
import {
  CreatePersonSchema,
  UpdatePersonSchema,
  PersonParamsSchema,
  MapIdParamsSchema,
} from './people.schema';

const router = Router();
const peopleController = new PeopleController();

// All people routes require authentication
router.use(requireAuth);

/**
 * Gift map-scoped routes
 */

// GET /api/v1/gift-maps/:mapId/people
router.get(
  '/gift-maps/:mapId/people',
  validateParams(MapIdParamsSchema.shape.params),
  peopleController.listPeople
);

// POST /api/v1/gift-maps/:mapId/people
router.post(
  '/gift-maps/:mapId/people',
  validate(CreatePersonSchema),
  peopleController.createPerson
);

/**
 * Person-specific routes
 */

// GET /api/v1/people/:id
router.get(
  '/people/:id',
  validateParams(PersonParamsSchema.shape.params),
  peopleController.getPerson
);

// GET /api/v1/people/:id/gift-ideas
router.get(
  '/people/:id/gift-ideas',
  validateParams(PersonParamsSchema.shape.params),
  peopleController.getPersonWithIdeas
);

// PATCH /api/v1/people/:id
router.patch(
  '/people/:id',
  validate(UpdatePersonSchema),
  peopleController.updatePerson
);

// DELETE /api/v1/people/:id
router.delete(
  '/people/:id',
  validateParams(PersonParamsSchema.shape.params),
  peopleController.deletePerson
);

export default router;
