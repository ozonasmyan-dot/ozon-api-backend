import { Router } from 'express';
import { analyticsController } from '@/modules/analytics/analytics.controller';

const router = Router();
router.get('/drr-by-date', analyticsController.getDrrByDate);

export default router;
