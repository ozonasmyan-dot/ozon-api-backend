import { Router } from 'express';
import { advertisingController } from '@/modules/advertising/controller/controller';
import asyncHandler from '@/shared/utils/asyncHandler';

const router = Router();
router.get('/sync', asyncHandler(advertisingController.sync));
router.get('/importdata', asyncHandler(advertisingController.importData));

export default router;
