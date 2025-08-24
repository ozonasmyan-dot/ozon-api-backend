import { Router } from 'express';
import { analyticsController } from '@/modules/analytics/controller/controller';
import asyncHandler from '@/utils/asyncHandler';

const router = Router();
router.get('/drr-by-date', asyncHandler(analyticsController.getDrrByDate));

export default router;
