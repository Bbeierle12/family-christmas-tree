import { z } from 'zod';

/**
 * User registration schema
 */
export const RegisterSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters'),
    displayName: z
      .string()
      .min(1, 'Display name is required')
      .max(100, 'Display name must be less than 100 characters'),
  }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>['body'];

/**
 * User login schema
 */
export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type LoginInput = z.infer<typeof LoginSchema>['body'];

/**
 * Refresh token schema
 */
export const RefreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>['body'];

/**
 * Forgot password schema
 */
export const ForgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>['body'];

/**
 * Reset password schema
 */
export const ResetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters'),
  }),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>['body'];

/**
 * Change password schema
 */
export const ChangePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password must be less than 128 characters'),
  }),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>['body'];
