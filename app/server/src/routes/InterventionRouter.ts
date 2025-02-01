import express, { Request, Response } from 'express';
import { AuthorizationMiddleware } from '../middlewares/AuthorizationMiddleware';
import { InterventionService } from '../services/InterventionService';
import { InterventionController } from '../controllers/InterventionController';
import { prismaDBClient } from '../../config/prisma';

const interventionService = new InterventionService(prismaDBClient);
const interventionController = new InterventionController(interventionService);

export const interventionRouter = express.Router();

interventionRouter.post('/requests/:puskesmasId/members/:memberId', AuthorizationMiddleware(['admin', 'healthcare', 'school', 'uks']), async (req: Request, res: Response) => {
    interventionController.requestIntervention(req, res);
})

interventionRouter.get('/requests/:puskesmasId/schools/:schoolId', AuthorizationMiddleware([]), async (req: Request, res: Response) => {
    interventionController.getRequestInterventionBelongToSchool(req, res);
})

interventionRouter.get('/requests/:puskesmasId/families/:familyId', AuthorizationMiddleware([]), async (req: Request, res: Response) => {
    interventionController.getRequestInterventionBelongToFamily(req, res);
})

interventionRouter.get('/requests/:puskesmasId', AuthorizationMiddleware(['admin', 'healthcare']), async (req: Request, res: Response) => {
    interventionController.getAllRequestIntervention(req, res);
})

// interventionRouter.post('/:institutionId/members/:memberId', AuthorizationMiddleware(['admin', 'healthcare']), async (req: Request, res: Response) => {
//     interventionController.createIntervention(req, res);
// })

// interventionRouter.get('/:institutionId/families/:familyId', AuthorizationMiddleware([]), async (req: Request, res: Response) => {
//     interventionController.getInterventionsBelongToFamily(req, res);
// })

// interventionRouter.get('/schools/:schoolId', AuthorizationMiddleware([]), async (req: Request, res: Response) => {
//     interventionController.getInterventionsBelongToSchool(req, res);
// })

// interventionRouter.get('/puskesmas/:institutionId', AuthorizationMiddleware(['admin', 'healthcare']), async (req: Request, res: Response) => {
//     interventionController.getInterventionsBelongToInstitution(req, res);
// })