import { Request, Response, NextFunction } from 'express';
import { GiftMapsService } from './gift-maps.service';
import { CreateGiftMapInput, UpdateGiftMapInput } from './gift-maps.schema';

export class GiftMapsController {
  private giftMapsService: GiftMapsService;

  constructor() {
    this.giftMapsService = new GiftMapsService();
  }

  /**
   * GET /api/v1/workspaces/:workspaceId/gift-maps
   * List gift maps in a workspace
   */
  listGiftMaps = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const giftMaps = await this.giftMapsService.listGiftMaps(
        req.params.workspaceId,
        req.user.id,
        {
          year: req.query.year as string,
          occasion: req.query.occasion as string,
          archived: req.query.archived === 'true',
        }
      );

      res.json({
        success: true,
        data: { giftMaps },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/workspaces/:workspaceId/gift-maps
   * Create a new gift map
   */
  createGiftMap = async (
    req: Request<{ workspaceId: string }, {}, CreateGiftMapInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const giftMap = await this.giftMapsService.createGiftMap(
        req.params.workspaceId,
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: { giftMap },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/gift-maps/:id
   * Get gift map by ID
   */
  getGiftMap = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const giftMap = await this.giftMapsService.getGiftMapById(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: { giftMap },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/gift-maps/:id/full
   * Get full gift map with all related data
   */
  getGiftMapFull = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const giftMap = await this.giftMapsService.getGiftMapFull(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: { giftMap },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/gift-maps/:id
   * Update gift map
   */
  updateGiftMap = async (
    req: Request<{ id: string }, {}, UpdateGiftMapInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const giftMap = await this.giftMapsService.updateGiftMap(
        req.params.id,
        req.user.id,
        req.body
      );

      res.json({
        success: true,
        data: { giftMap },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/gift-maps/:id
   * Delete (archive) gift map
   */
  deleteGiftMap = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      await this.giftMapsService.deleteGiftMap(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Gift map archived successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/gift-maps/:id/duplicate
   * Duplicate gift map
   */
  duplicateGiftMap = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const giftMap = await this.giftMapsService.duplicateGiftMap(
        req.params.id,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: { giftMap },
        message: 'Gift map duplicated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/gift-maps/:id/activity
   * Get activity log for gift map
   */
  getActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : 50;

      const activities = await this.giftMapsService.getGiftMapActivity(
        req.params.id,
        req.user.id,
        limit
      );

      res.json({
        success: true,
        data: { activities },
      });
    } catch (error) {
      next(error);
    }
  };
}
