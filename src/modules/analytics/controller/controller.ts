import {Request, Response} from "express";
import container from '@/infrastructure/di/container';
import {AnalyticsService} from "@/modules/analytics/service/service";

const analyticsService = container.resolve(AnalyticsService);

export const analyticsController = {
    async getDrrByDate(req: Request, res: Response) {
        const data = await analyticsService.getDrrByDate('2025-07-02');

        res.json({data});
    },
};
