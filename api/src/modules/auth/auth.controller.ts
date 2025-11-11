import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from './auth.schema';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  register = async (
    req: Request<{}, {}, RegisterInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await this.authService.register(req.body);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/login
   * Login a user
   */
  login = async (
    req: Request<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await this.authService.login(req.body);

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  refresh = async (
    req: Request<{}, {}, RefreshTokenInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await this.authService.refresh(req.body.refreshToken);

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/logout
   * Logout a user
   */
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      await this.authService.logout(req.user.id);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/auth/me
   * Get current user
   */
  getCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const user = await this.authService.getCurrentUser(req.user.id);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/change-password
   * Change user password
   */
  changePassword = async (
    req: Request<{}, {}, ChangePasswordInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      await this.authService.changePassword(req.user.id, req.body);

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      next(error);
    }
  };
}
