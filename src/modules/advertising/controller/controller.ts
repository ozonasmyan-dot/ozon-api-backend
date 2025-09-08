import {Request, Response} from "express";
import container from '@/infrastructure/di/container';
import {AdvertisingService} from "@/modules/advertising/service/service";
import { AppError } from "@/shared/types/AppError";
import { toCsv } from "@/shared/utils/csv.utils";
import { Prisma } from '@prisma/client';

const advertisingService = container.resolve(AdvertisingService);

export const advertisingController = {
    async sync(req: Request, res: Response) {
        await advertisingService.sync();

        res.json({data: 'OK'});
    },

    async getAll(req: Request, res: Response): Promise<void> {
        const {from, to, sku} = req.query;

        const filter: Prisma.AdvertisingWhereInput = {};

        if (from || to) {
            filter.savedAt = {};
            if (from) {
                filter.savedAt.gte = new Date(String(from));
            }
            if (to) {
                filter.savedAt.lte = new Date(String(to));
            }
        }

        if (sku) {
            const skuArray = Array.isArray(sku) ? sku.map(String) : [String(sku)];
            filter.productId = {in: skuArray};
        }

        const data = await advertisingService.getAll(filter);
        if (data.length === 0) {
            throw new AppError<undefined>('Advertising not found', 404);
        }

        if (req.query.format === 'csv') {
            res.header('Content-Type', 'text/csv');
            res.attachment('advertising.csv');
            res.send(toCsv(data as unknown as Record<string, unknown>[]));
            return;
        }

        res.json(data);
    },
};
