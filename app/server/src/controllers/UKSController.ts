import { Request, Response } from "express";
import { UKSService } from "../services/UKSService";
import { handleError, validatePayload } from "../common/http";
import { addBookSchema } from "../common/http/requestvalidator/UKSValidator";
import { InvariantError } from "../common/exception";
import { IBookUKS } from "../types/uks";

export class UKSController {
    constructor(public UKSService: UKSService) {

    }

    async addBook(req: Request, res: Response) {
        try {
            validatePayload(addBookSchema, req.body);
            const { healthCareId } = req.params;
            if (!healthCareId) {
                throw new InvariantError('Health care id is required in params');
            }

            const { thumbnail, file } = req.files as any;
            console.log({ thumbnail, file })

            const user = (req as any).user;
            const payload: IBookUKS = req.body;

            const { book } = await this.UKSService.addBook(+healthCareId, user.id, {
                ...payload,
                thumbnailUrl: thumbnail[0].filename,
                fileUrl: file[0].filename
            });

            res.status(201).json({
                status: 'Success',
                message: 'Book added successfully',
                data: book
            })
        } catch (err: any) {
            handleError(err, res);
        }
    }
}