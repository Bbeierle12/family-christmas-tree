import { Request, Response, NextFunction } from 'express';
import { GiftIdeasService } from './gift-ideas.service';
import { CreateGiftIdeaInput, UpdateGiftIdeaInput } from './gift-ideas.schema';

export class GiftIdeasController {
  private giftIdeasService: GiftIdeasService;

  constructor() {
    this.giftIdeasService = new GiftIdeasService();
  }

  /**
   * GET /api/v1/people/:personId/gift-ideas
   * List gift ideas for a person
   */
  listGiftIdeas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const giftIdeas = await this.giftIdeasService.listGiftIdeas(
        req.params.personId,
        req.user.id,
        {
          status: req.query.status as string,
          priority: req.query.priority as string,
          minPrice: req.query.minPrice as string,
          maxPrice: req.query.maxPrice as string,
        }
      );

      res.json({
        success: true,
        data: { giftIdeas },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/people/:personId/gift-ideas
   * Create a new gift idea
   */
  createGiftIdea = async (
    req: Request<{ personId: string }, {}, CreateGiftIdeaInput>,
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

      const giftIdea = await this.giftIdeasService.createGiftIdea(
        req.params.personId,
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: { giftIdea },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/gift-ideas/:id
   * Get gift idea by ID
   */
  getGiftIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const giftIdea = await this.giftIdeasService.getGiftIdeaById(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: { giftIdea },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/gift-ideas/:id/comments
   * Get gift idea with comments
   */
  getGiftIdeaWithComments = async (
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

      const giftIdea = await this.giftIdeasService.getGiftIdeaWithComments(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: { giftIdea },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/gift-ideas/:id
   * Update gift idea
   */
  updateGiftIdea = async (
    req: Request<{ id: string }, {}, UpdateGiftIdeaInput>,
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

      const giftIdea = await this.giftIdeasService.updateGiftIdea(
        req.params.id,
        req.user.id,
        req.body
      );

      res.json({
        success: true,
        data: { giftIdea },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/gift-ideas/:id
   * Delete gift idea
   */
  deleteGiftIdea = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      await this.giftIdeasService.deleteGiftIdea(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Gift idea deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/gift-ideas/:id/purchase
   * Mark gift idea as purchased
   */
  purchaseGiftIdea = async (
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

      const giftIdea = await this.giftIdeasService.purchaseGiftIdea(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: { giftIdea },
        message: 'Gift idea marked as purchased',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/gift-ideas/:id/unpurchase
   * Mark gift idea as unpurchased
   */
  unpurchaseGiftIdea = async (
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

      const giftIdea = await this.giftIdeasService.unpurchaseGiftIdea(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: { giftIdea },
        message: 'Gift idea marked as unpurchased',
      });
    } catch (error) {
      next(error);
    }
  };
}
