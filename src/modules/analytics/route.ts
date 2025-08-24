import { Router } from 'express';
import { analyticsController } from '@/modules/analytics/controller/controller';
import asyncHandler from '@/shared/utils/asyncHandler';

const router = Router();
router.get('/drr', asyncHandler(analyticsController.getDrr));

export default router;