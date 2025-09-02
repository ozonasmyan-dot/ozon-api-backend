import { Request, Response } from "express";
import container from '@/infrastructure/di/container';
import { UnitService } from "@/modules/unit/service/service";
import { AppError } from "@/shared/types/AppError";
import { toCsv } from "@/shared/utils/csv.utils";
import { Prisma } from '@prisma/client';

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
        const booleanFields = ['isPremium'];
        const numberFields = ['oldPrice', 'price', 'margin', 'costPrice', 'totalServices'];
        const dateFields = ['createdAt', 'inProcessAt', 'lastOperationDate'];

        const filter: Prisma.UnitNewWhereInput = {};

        Object.entries(req.query).forEach(([key, value]) => {
            if (key === 'format' || Array.isArray(value)) {
                return;
            }

            const target = filter as Record<string, unknown>;
            if (booleanFields.includes(key)) {
                target[key] = value === 'true';
            } else if (numberFields.includes(key)) {
                const num = Number(value);
                if (!isNaN(num)) {
                    target[key] = num;
                }
            } else if (dateFields.includes(key)) {
                const date = new Date(value as string);
                if (!isNaN(date.getTime())) {
                    target[key] = date;
                }
            } else {
                target[key] = value as string;
            }
        });

        const data = await unitService.getAll(filter);
        if (data.length === 0) {
            throw new AppError<undefined>('Units not found', 404);
        }

        if (req.query.format === 'csv') {
            res.header('Content-Type', 'text/csv');
            res.attachment('units.csv');
            res.send(toCsv(data as unknown as Record<string, unknown>[]));
            return;
        }

        res.json(data);
    },

    async getOrdersSummary(req: Request, res: Response): Promise<void> {
        const data = await unitService.getOrdersSummary();
        if (data.length === 0) {
            throw new AppError<undefined>('Orders summary not found', 404);
        }

        if (req.query.format === 'csv') {
            res.header('Content-Type', 'text/csv');
            res.attachment('orders-summary.csv');
            res.send(toCsv(data as unknown as Record<string, unknown>[]));
            return;
        }

        res.json(data);
    },
};
