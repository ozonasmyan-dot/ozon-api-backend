import {Request, Response} from "express";
import {analyticsService} from "@/modules/analytics/analytics.service";

export const analyticsController = {
    async getDrrByDate(req: Request, res: Response) {
        const data = await analyticsService.getDrrByDate('2025-07-02');

        res.json({data});
    },
};
