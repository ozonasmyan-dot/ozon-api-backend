import {Request, Response} from 'express';
import container from '@/infrastructure/di/container';
import {AdvertisingHourlyService} from '@/modules/advertising-hourly/service/service';
import {AppError} from '@/shared/types/AppError';

const service = container.resolve(AdvertisingHourlyService);

export const advertisingHourlyController = {
    async getAll(req: Request, res: Response) {
        const data = await service.getAll();
        if (data.length === 0) {
            throw new AppError<undefined>('Ads not found', 404);
        }
        res.json(data);
    },
};
