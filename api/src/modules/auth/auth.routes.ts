import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { authRateLimiter, speedLimiter } from '@/middleware/security';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
} from './auth.schema';

const router = Router();
const authController = new AuthController();

// Apply rate limiting and slow down to all auth routes
router.use(authRateLimiter);
router.use(speedLimiter);

/**
 * Public routes (no authentication required)
 */

// POST /api/v1/auth/register
router.post(
  '/register',
  validate(RegisterSchema),
  authController.register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  validate(LoginSchema),
  authController.login
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  validate(RefreshTokenSchema),
  authController.refresh
);

/**
 * Protected routes (authentication required)
 */

// GET /api/v1/auth/me
router.get('/me', requireAuth, authController.getCurrentUser);

// POST /api/v1/auth/logout
router.post('/logout', requireAuth, authController.logout);

// POST /api/v1/auth/change-password
router.post(
  '/change-password',
  requireAuth,
  validate(ChangePasswordSchema),
  authController.changePassword
);

export default router;
