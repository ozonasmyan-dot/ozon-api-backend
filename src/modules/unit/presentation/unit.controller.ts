import { Request, Response } from "express";
import container from '@/infrastructure/di/container';
import { UnitService } from "@/modules/unit/application/unit.service";
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
};
