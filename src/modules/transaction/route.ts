import { Router } from 'express';
import { transactionController } from '@/modules/transaction/controller/controller';
import asyncHandler from '@/shared/utils/asyncHandler';

const router = Router();

router.get('/sync', asyncHandler(transactionController.sync));

export default router;

