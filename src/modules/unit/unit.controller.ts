import {Request, Response} from "express";
import {unitService} from "./unit.service";

export const unitController = {
    async sync(req: Request, res: Response): Promise<any> {
        await unitService.sync();

        const data = await unitService.getAll();

        res.json(data);
    },

    async getAll(req: Request, res: Response): Promise<any> {
        const data = await unitService.getAll();

        res.json(data);
    },
};
