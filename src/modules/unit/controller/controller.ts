import { Request, Response } from "express";
import { unitService } from "@/modules/unit/service/service";
import { AppError } from "@/shared/types/AppError";

export const unitController = {
    async sync(req: Request, res: Response): Promise<any> {
        await unitService.sync();

        const data = await unitService.getAll();
        if (data.length === 0) {
            throw new AppError('Units not found', 404);
        }

        res.json(data);
    },

    async getAll(req: Request, res: Response): Promise<any> {
        const data = await unitService.getAll();
        if (data.length === 0) {
            throw new AppError('Units not found', 404);
        }

        res.json(data);
    },
};
