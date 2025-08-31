import { Request, Response } from 'express';
import container from '@/infrastructure/di/container';
import { TransactionService } from '@/modules/transaction/service/service';

const transactionService = container.resolve(TransactionService);

export const transactionController = {
    async sync(req: Request, res: Response): Promise<void> {
        await transactionService.sync();
        res.json({ data: 'OK' });
    },
};

