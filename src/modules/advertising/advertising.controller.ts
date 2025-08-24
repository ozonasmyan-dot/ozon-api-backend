import {Request, Response} from "express";
import {advertisingService} from "./advertising.service";

export const advertisingController = {
    async sync(req: Request, res: Response) {
        await advertisingService.sync();

        res.json({data: 'OK'});
    },
};
