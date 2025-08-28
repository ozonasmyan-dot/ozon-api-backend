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
};
