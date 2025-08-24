import { Request, Response } from "express";
import container from '@/infrastructure/di/container';
import { AnalyticsService } from "@/modules/analytics/service/service";
import { DrrRequestDto } from "@/modules/analytics/dto/drr.dto";

const analyticsService = container.resolve(AnalyticsService);

export const analyticsController = {
    async getDrrByDate(req: Request, res: Response) {
        const data = await analyticsService.getDrrByDate('2025-07-02');

        res.json({data});
    },

    async getDrr(req: Request, res: Response) {
        const { dateFrom, dateTo, sku } = req.query;
        const query: DrrRequestDto = {
            dateFrom: String(dateFrom),
            dateTo: String(dateTo),
            sku: Array.isArray(sku) ? sku.map(String) : typeof sku === 'string' ? [sku] : [],
        };

        const data = await analyticsService.getDrr(query);

        res.json({ data });
    },
};
