import {Request, Response} from "express";
import container from '@/infrastructure/di/container';
import {AdvertisingService} from "@/modules/advertising/service/service";
import { AppError } from "@/shared/types/AppError";
import { toCsv } from "@/shared/utils/csv.utils";

const advertisingService = container.resolve(AdvertisingService);

export const advertisingController = {
    async sync(req: Request, res: Response) {
        await advertisingService.sync();

        res.json({data: 'OK'});
    },

    async getAll(req: Request, res: Response): Promise<void> {
        const data = await advertisingService.getAll();
        if (data.length === 0) {
            throw new AppError<undefined>('Advertising not found', 404);
        }

        if (req.query.format === 'csv') {
            res.header('Content-Type', 'text/csv');
            res.send(toCsv(data as unknown as Record<string, unknown>[]));
            return;
        }

        res.json(data);
    },
};
