import {Request, Response} from "express";
import {unitService} from "./unit.service";

export const unitController = {
    async sync(req: Request, res: Response): Promise<any> {
        try {
            await unitService.sync();

            console.log('121');

            const data = await unitService.getAll();

            res.json(data);
        } catch (error: any) {
            let message = "Неизвестная ошибка";

            // Если это ошибка axios
            if (error.isAxiosError) {
                message =
                    error.response?.data?.message ||
                    error.message ||
                    "Ошибка при запросе";
            } else if (error instanceof Error) {
                message = error.message;
            }

            console.error("[unitController] Ошибка:", message);

            return res.status(500).json({error: message});
        }
    },

    async getAll(req: Request, res: Response): Promise<any> {
        try {
            const data = await unitService.getAll();

            res.json(data);
        } catch (error: any) {
            let message = "Неизвестная ошибка";

            // Если это ошибка axios
            if (error.isAxiosError) {
                message =
                    error.response?.data?.message ||
                    error.message ||
                    "Ошибка при запросе";
            } else if (error instanceof Error) {
                message = error.message;
            }

            console.error("[unitController] Ошибка:", message);

            return res.status(500).json({error: message});
        }
    },
};