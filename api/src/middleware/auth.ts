import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { verifyAccessToken } from '@/shared/utils/jwt';
import { UnauthorizedError, ForbiddenError } from '@/shared/errors';

/**
 * Middleware to require authentication
 * Extracts and verifies JWT token, attaches user to request
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyAccessToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to optionally authenticate
 * If token is provided, verifies it, otherwise continues
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}

/**
 * Middleware to require workspace membership with specific role
 */
export function requireWorkspaceRole(
  minimumRole: 'owner' | 'editor' | 'viewer' = 'viewer'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Extract workspace ID from params or body
      const workspaceId = req.params.workspaceId || req.params.id;

      if (!workspaceId) {
        throw new ForbiddenError('Workspace ID required');
      }

      // Check membership
      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: req.user.id,
          status: 'active',
        },
      });

      if (!member) {
        throw new ForbiddenError('Not a member of this workspace');
      }

      // Role hierarchy: owner > editor > viewer
      const roleHierarchy = { owner: 3, editor: 2, viewer: 1 };
      const userRoleLevel = roleHierarchy[member.role as keyof typeof roleHierarchy];
      const requiredRoleLevel = roleHierarchy[minimumRole];

      if (userRoleLevel < requiredRoleLevel) {
        throw new ForbiddenError(`Requires ${minimumRole} role`);
      }

      // Attach workspace member to request
      req.workspaceMember = member;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
}
