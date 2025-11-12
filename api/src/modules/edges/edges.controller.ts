import { Request, Response, NextFunction } from 'express';
import { EdgesService } from './edges.service';
import { CreateEdgeInput } from './edges.schema';

export class EdgesController {
  private edgesService: EdgesService;

  constructor() {
    this.edgesService = new EdgesService();
  }

  /**
   * GET /api/v1/gift-maps/:mapId/edges
   * List edges in a gift map
   */
  listEdges = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const edges = await this.edgesService.listEdges(
        req.params.mapId,
        req.user.id
      );

      res.json({
        success: true,
        data: { edges },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/gift-maps/:mapId/edges
   * Create a new edge
   */
  createEdge = async (
    req: Request<{ mapId: string }, {}, CreateEdgeInput>,
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

      const edge = await this.edgesService.createEdge(
        req.params.mapId,
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: { edge },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/edges/:id
   * Delete an edge
   */
  deleteEdge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      await this.edgesService.deleteEdge(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Edge deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
