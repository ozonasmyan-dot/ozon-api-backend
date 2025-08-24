import {Request, Response} from "express";
import {advertisingService} from "./advertising.service";

export const advertisingController = {
    async sync(req: Request, res: Response) {
        try {
            await advertisingService.sync();

            res.json({data: 'OK'});
        } catch (err) {
            console.error("[analyticsController] Ошибка:", err);
            res.status(500).json({error: err});
        }
    },
};
