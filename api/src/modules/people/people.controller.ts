import { Request, Response, NextFunction } from 'express';
import { PeopleService } from './people.service';
import { CreatePersonInput, UpdatePersonInput } from './people.schema';

export class PeopleController {
  private peopleService: PeopleService;

  constructor() {
    this.peopleService = new PeopleService();
  }

  /**
   * GET /api/v1/gift-maps/:mapId/people
   * List people in a gift map
   */
  listPeople = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const people = await this.peopleService.listPeople(
        req.params.mapId,
        req.user.id
      );

      res.json({
        success: true,
        data: { people },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/gift-maps/:mapId/people
   * Create a new person
   */
  createPerson = async (
    req: Request<{ mapId: string }, {}, CreatePersonInput>,
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

      const person = await this.peopleService.createPerson(
        req.params.mapId,
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: { person },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/people/:id
   * Get person by ID
   */
  getPerson = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const person = await this.peopleService.getPersonById(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: { person },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/people/:id/gift-ideas
   * Get person with all gift ideas
   */
  getPersonWithIdeas = async (
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

      const person = await this.peopleService.getPersonWithIdeas(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: { person },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/people/:id
   * Update person
   */
  updatePerson = async (
    req: Request<{ id: string }, {}, UpdatePersonInput>,
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

      const person = await this.peopleService.updatePerson(
        req.params.id,
        req.user.id,
        req.body
      );

      res.json({
        success: true,
        data: { person },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/people/:id
   * Delete person
   */
  deletePerson = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      await this.peopleService.deletePerson(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Person deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
