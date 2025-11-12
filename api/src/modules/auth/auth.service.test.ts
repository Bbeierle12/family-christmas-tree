import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import {
  testPrisma,
  createTestUser,
  createTestWorkspace,
} from '@/test/setup';
import { hashPassword, comparePassword } from '@/shared/utils/password';
import { UnauthorizedError, ConflictError } from '@/shared/errors/AppError';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create a new user with default workspace', async () => {
      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'Test1234!',
        displayName: 'New User',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.displayName).toBe('New User');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Verify user was created in database
      const user = await testPrisma.user.findUnique({
        where: { email: 'newuser@example.com' },
        include: {
          ownedWorkspaces: true,
        },
      });

      expect(user).toBeDefined();
      expect(user?.ownedWorkspaces.length).toBe(1);
      expect(user?.ownedWorkspaces[0].name).toBe("New User's Workspace");
    });

    it('should hash the password', async () => {
      await authService.register({
        email: 'test@example.com',
        password: 'Test1234!',
        displayName: 'Test',
      });

      const user = await testPrisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe('Test1234!');

      // Verify password can be compared
      const isValid = await comparePassword('Test1234!', user!.passwordHash);
      expect(isValid).toBe(true);
    });

    it('should throw error if email already exists', async () => {
      await authService.register({
        email: 'duplicate@example.com',
        password: 'Test1234!',
        displayName: 'First',
      });

      await expect(
        authService.register({
          email: 'duplicate@example.com',
          password: 'Test1234!',
          displayName: 'Second',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create test user with known password
      const hashedPassword = await hashPassword('Test1234!');
      await createTestUser({
        email: 'login@example.com',
        displayName: 'Login User',
        passwordHash: hashedPassword,
      });
    });

    it('should login with correct credentials', async () => {
      const result = await authService.login({
        email: 'login@example.com',
        password: 'Test1234!',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('login@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error with incorrect password', async () => {
      await expect(
        authService.login({
          email: 'login@example.com',
          password: 'WrongPassword!',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw error with non-existent email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Test1234!',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should create session record on login', async () => {
      const result = await authService.login({
        email: 'login@example.com',
        password: 'Test1234!',
      });

      const sessions = await testPrisma.session.findMany({
        where: { userId: result.user.id },
      });

      expect(sessions.length).toBe(1);
      expect(sessions[0].refreshToken).toBeDefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user by id', async () => {
      const testUser = await createTestUser({
        email: 'current@example.com',
        displayName: 'Current User',
      });

      const user = await authService.getCurrentUser(testUser.id);

      expect(user).toBeDefined();
      expect(user.email).toBe('current@example.com');
      expect(user.displayName).toBe('Current User');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.getCurrentUser('non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    let testUser: any;

    beforeEach(async () => {
      const hashedPassword = await hashPassword('OldPassword1234!');
      testUser = await createTestUser({
        email: 'changepass@example.com',
        displayName: 'Change Pass User',
        passwordHash: hashedPassword,
      });
    });

    it('should change password with correct old password', async () => {
      await authService.changePassword(testUser.id, {
        currentPassword: 'OldPassword1234!',
        newPassword: 'NewPassword1234!',
      });

      // Verify new password works
      const result = await authService.login({
        email: 'changepass@example.com',
        password: 'NewPassword1234!',
      });

      expect(result.user).toBeDefined();
    });

    it('should throw error with incorrect old password', async () => {
      await expect(
        authService.changePassword(testUser.id, {
          currentPassword: 'WrongOldPassword!',
          newPassword: 'NewPassword1234!',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should invalidate all sessions after password change', async () => {
      // Create session
      await authService.login({
        email: 'changepass@example.com',
        password: 'OldPassword1234!',
      });

      // Change password
      await authService.changePassword(testUser.id, {
        currentPassword: 'OldPassword1234!',
        newPassword: 'NewPassword1234!',
      });

      // Verify sessions were deleted
      const sessions = await testPrisma.session.findMany({
        where: { userId: testUser.id },
      });

      expect(sessions.length).toBe(0);
    });
  });

  describe('logout', () => {
    it('should delete user session', async () => {
      const hashedPassword = await hashPassword('Test1234!');
      const testUser = await createTestUser({
        email: 'logout@example.com',
        passwordHash: hashedPassword,
      });

      // Login to create session
      const loginResult = await authService.login({
        email: 'logout@example.com',
        password: 'Test1234!',
      });

      // Verify session exists
      let sessions = await testPrisma.session.findMany({
        where: { userId: testUser.id },
      });
      expect(sessions.length).toBe(1);

      // Logout
      await authService.logout(testUser.id);

      // Verify session was deleted
      sessions = await testPrisma.session.findMany({
        where: { userId: testUser.id },
      });
      expect(sessions.length).toBe(0);
    });
  });
});
