import { Request, Response } from "express";
import { InterventionService } from "../services/InterventionService";
import { handleError, validatePayload } from "../common/http";
import { InvariantError } from "../common/exception";
import { createInterventionSchema } from "../common/http/requestvalidator/InterventionValidator";

export class InterventionController {
    constructor(public interventionService: InterventionService) {

    }

    async requestIntervention(req: Request, res: Response) {
        try {
            const { puskesmasId, memberId } = req.params;
            if (!puskesmasId || !memberId) {
                throw new InvariantError("Puskesmas ID and  Member ID must be provided");
            }
            const user = (req as any).user
            const { intervention } = await this.interventionService.requestIntervention({
                createdBy: user.id,
                familyId: +memberId,
                institutionId: +puskesmasId
            })
            res.status(201).json({
                status: 'Success',
                message: `Request Intervention to Puskesmas ${puskesmasId} for member ${memberId} created successfully`,
                data: intervention
            })
        } catch (err: any) {
            handleError(err, res);
        }
    }

    async getRequestInterventionBelongToSchool(req: Request, res: Response) {
        try {
            const { puskesmasId, schoolId } = req.params;
            if (!puskesmasId || !schoolId) {
                throw new InvariantError("Puskesmas ID and schoolId must be provided in params");
            }
            const { requestInterventions } = await this.interventionService.getRequestedInterventionBelongToSchool(+puskesmasId, +schoolId);
            res.status(200).json({
                status: 'Success',
                message: `Request Intervention fetched successfully`,
                data: requestInterventions
            })
        } catch (err: any) {
            handleError(err, res);
        }
    }

    async getRequestInterventionBelongToFamily(req: Request, res: Response) {
        try {
            const { puskesmasId, familyId } = req.params;
            if (!puskesmasId || !familyId) {
                throw new InvariantError("Puskesmas ID and Family ID must be provided in params");
            }
            const { requestInterventions } = await this.interventionService.getRequestInterventionBelongToFamily(+puskesmasId, +familyId);
            res.status(200).json({
                status: 'Success',
                message: `Request Intervention fetched successfully`,
                data: requestInterventions
            })
        } catch (err: any) {
            handleError(err, res);
        }
    }

    async getAllRequestIntervention(req: Request, res: Response) {
        try {
            const { puskesmasId } = req.params;
            if (!puskesmasId) {
                throw new InvariantError("Puskesmas ID must be provided in params");
            }
            const { requestInterventions } = await this.interventionService.getAllRequestInterventionBelongToInstitution(+puskesmasId);
            res.status(200).json({
                status: 'Success',
                message: `Request Intervention fetched successfully`,
                data: requestInterventions
            })
        } catch (err: any) {
            handleError(err, res);
        }
    }

    // async createIntervention(req: Request, res: Response) {
    //     try {
    //         validatePayload(createInterventionSchema, req.body);
    //         const { memberId, institutionId } = req.params;
    //         if (!memberId || !institutionId) {
    //             throw new InvariantError("Member ID and Institution ID must be provided");
    //         }
    //         const payload = req.body;
    //         const user = (req as any).user
    //         console.log({ payload, memberId, institutionId })

    //         const { intervention } = await this.interventionService.createIntervention({
    //             createdBy: user.id,
    //             familyMemberId: +memberId,
    //             instituonId: +institutionId,
    //             recommendation: payload.recommendation,
    //             programRecommendation: payload.programRecommendation
    //         })

    //         res.status(201).json({
    //             status: 'Success',
    //             message: 'Intervention created successfully',
    //             data: intervention
    //         })
    //     } catch (err: any) {
    //         handleError(err, res);
    //     }
    // }

    // async getInterventionsBelongToFamily(req: Request, res: Response) {
    //     try {
    //         const { institutionId, familyId } = req.params;
    //         if (!institutionId || !familyId) {
    //             throw new InvariantError("Institution ID and Family ID must be provided");
    //         }

    //         const { interventions } = await this.interventionService.getInterventionsBelongToFamily(+institutionId, +familyId);

    //         res.status(200).json({
    //             status: 'Success',
    //             message: 'Interventions fetched successfully',
    //             data: interventions
    //         })
    //     } catch (err: any) {
    //         handleError(err, res);
    //     }
    // }

    // async getInterventionsBelongToInstitution(req: Request, res: Response) {
    //     try {
    //         const { institutionId } = req.params;
    //         if (!institutionId) {
    //             throw new InvariantError("Institution ID must be provided");
    //         }

    //         const { interventions } = await this.interventionService.getInterventionsBelongToInstitution(+institutionId);

    //         res.status(200).json({
    //             status: 'Success',
    //             message: 'Interventions fetched successfully',
    //             data: interventions
    //         })
    //     } catch (err: any) {
    //         handleError(err, res);
    //     }
    // }

    // async getInterventionsBelongToSchool(req: Request, res: Response) {
    //     try {
    //         const { schoolId } = req.params;
    //         if (!schoolId) {
    //             throw new InvariantError("Institution ID must be provided");
    //         }

    //         const { interventions } = await this.interventionService.getInterventionBelongsToSchool(+schoolId);

    //         res.status(200).json({
    //             status: 'Success',
    //             message: 'Interventions fetched successfully',
    //             data: interventions
    //         })
    //     } catch (err: any) {
    //         handleError(err, res);
    //     }
    // }



    // async getInterventionById(req: Request, res: Response) {
    //     try {
    //         const { interventionId } = req.params;
    //         if (!interventionId) {
    //             throw new InvariantError("Intervention ID must be provided");
    //         }

    //         const { intervention } = await this.interventionService.getInterventionById(+interventionId);

    //         res.status(200).json({
    //             status: 'Success',
    //             message: 'Intervention fetched successfully',
    //             data: intervention
    //         })
    //     } catch (err: any) {
    //         handleError(err, res);
    //     }
    // }
};
