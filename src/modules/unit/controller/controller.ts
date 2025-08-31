import { Request, Response } from "express";
import container from '@/infrastructure/di/container';
import { UnitService } from "@/modules/unit/service/service";
import { AppError } from "@/shared/types/AppError";
import { toCsv } from "@/shared/utils/csv.utils";

const unitService = container.resolve(UnitService);

export const unitController = {
    async sync(req: Request, res: Response): Promise<any> {
        await unitService.sync();

        const data = await unitService.getAll();
        if (data.length === 0) {
            throw new AppError<undefined>('Units not found', 404);
        }

        res.json(data);
    },

    async getAll(req: Request, res: Response): Promise<void> {
        const data = await unitService.getAll();
        if (data.length === 0) {
            throw new AppError<undefined>('Units not found', 404);
        }

        if (req.query.format === 'csv') {
            res.header('Content-Type', 'text/csv');
            res.send(toCsv(data as unknown as Record<string, unknown>[]));
            return;
        }

        res.json(data);
    },
};
