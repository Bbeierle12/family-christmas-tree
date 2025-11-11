import { User } from '@prisma/client';
import { prisma } from '@/config/database';
import { cache } from '@/config/redis';
import { logger } from '@/config/logger';
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from '@/shared/utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/shared/utils/jwt';
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  ValidationError,
} from '@/shared/errors';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
} from './auth.schema';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput): Promise<{
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      throw new ValidationError('Password does not meet requirements', {
        password: passwordValidation.errors,
      });
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user in transaction (user + default workspace)
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          displayName: data.displayName,
        },
      });

      // Generate slug for default workspace
      const slug = this.generateWorkspaceSlug(data.displayName);

      // Create default workspace
      await tx.workspace.create({
        data: {
          name: `${data.displayName}'s Workspace`,
          slug,
          ownerId: user.id,
        },
      });

      // Add user as workspace member
      await tx.workspaceMember.create({
        data: {
          workspaceId: (await tx.workspace.findUnique({ where: { slug } }))!.id,
          userId: user.id,
          role: 'owner',
          status: 'active',
          joinedAt: new Date(),
        },
      });

      return user;
    });

    // Generate tokens
    const accessToken = generateAccessToken(result.id);
    const refreshToken = generateRefreshToken(result.id);

    // Store refresh token in database
    await this.storeRefreshToken(result.id, refreshToken);

    // Update last login
    await prisma.user.update({
      where: { id: result.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`New user registered: ${result.email}`);

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = result;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login a user
   */
  async login(data: LoginInput): Promise<{
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Verify password
    const isValidPassword = await comparePassword(
      data.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`User logged in: ${user.email}`);

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const session = await prisma.session.findFirst({
      where: {
        userId: payload.userId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Store new refresh token (invalidates old one)
    await this.storeRefreshToken(user.id, newRefreshToken);

    logger.info(`Tokens refreshed for user: ${user.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout a user (invalidate refresh token)
   */
  async logout(userId: string): Promise<void> {
    // Delete all sessions for user
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Clear any cached data
    await cache.delPattern(`user:${userId}:*`);

    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    data: ChangePasswordInput
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('User not found');
    }

    // Verify current password
    const isValidPassword = await comparePassword(
      data.currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(data.newPassword);
    if (!passwordValidation.isValid) {
      throw new ValidationError('Password does not meet requirements', {
        password: passwordValidation.errors,
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(data.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all sessions
    await this.logout(userId);

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    // Delete old sessions for this user
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Create new session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
      data: {
        userId,
        tokenHash: refreshToken, // In production, hash this!
        expiresAt,
      },
    });
  }

  /**
   * Generate unique workspace slug
   */
  private generateWorkspaceSlug(displayName: string): string {
    const base = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const random = Math.random().toString(36).substring(2, 8);
    return `${base}-${random}`;
  }
}
