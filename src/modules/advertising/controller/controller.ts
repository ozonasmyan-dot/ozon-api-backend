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

    async importData(req: Request, res: Response) {
        const data = await advertisingService.getAll();
        if (data.length === 0) {
            throw new AppError<undefined>('Ads not found', 404);
        }

        const csv = toCsv(data as any[]);
        res.header('Content-Type', 'text/csv').send(csv);
    },
};
