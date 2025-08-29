import { Router } from 'express';
import { analyticsController } from '@/modules/analytics/presentation/analytics.controller';
import asyncHandler from '@/shared/utils/asyncHandler';

const router = Router();
router.get('/drr', asyncHandler(analyticsController.getDrr));
router.get('/buyout', asyncHandler(analyticsController.getBuyout));
router.get('/margin', asyncHandler(analyticsController.getMargin));

export default router;
