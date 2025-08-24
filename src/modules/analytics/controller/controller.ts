import { Request, Response } from "express";
import container from '@/infrastructure/di/container';
import { AnalyticsService } from "@/modules/analytics/service/service";
import { DrrRequestDto, DrrResponseDto } from "@/modules/analytics/dto/drr.dto";

const analyticsService = container.resolve(AnalyticsService);

export const analyticsController = {
    async getDrr(req: Request, res: Response) {
        const { date, sku } = req.query;

        const query: DrrRequestDto = {
            date: String(date),
            sku: Array.isArray(sku) ? sku.map(String) : typeof sku === 'string' ? [sku] : [],
        };

        const data: DrrResponseDto = await analyticsService.getDrr(query);

        res.json({ data });
    },
};
