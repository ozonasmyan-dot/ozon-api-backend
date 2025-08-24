import { Request, Response } from "express";
import container from '@/infrastructure/di/container';
import { AnalyticsService } from "@/modules/analytics/service/service";
import { DrrRequestDto, DrrResponseDto } from "@/modules/analytics/dto/drr.dto";
import { BuyoutRequestDto, BuyoutMonthDto } from "@/modules/analytics/dto/buyout.dto";
import dayjs from "dayjs";

const analyticsService = container.resolve(AnalyticsService);

export const analyticsController = {
    async getDrr(req: Request, res: Response) {
        const { date, sku } = req.query;

        const query: DrrRequestDto = {
            date: date ? String(date) : dayjs().format('YYYY-MM-DD'),
            sku: Array.isArray(sku) ? sku.map(String) : typeof sku === 'string' ? [sku] : [],
        };

        const data: DrrResponseDto = await analyticsService.getDrr(query);

        res.json({ data });
    },
    async getBuyout(req: Request, res: Response) {
        const { from, to, sku } = req.query;

        const query: BuyoutRequestDto = {
            from: String(from),
            to: String(to),
            sku: Array.isArray(sku) ? sku.map(String) : typeof sku === 'string' ? [sku] : [],
        };

        const data: BuyoutMonthDto[] = await analyticsService.getBuyout(query);

        res.json({ data });
    },
};
