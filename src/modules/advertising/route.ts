import { Router } from 'express';
import { advertisingController } from '@/modules/advertising/controller/controller';
import asyncHandler from '@/utils/asyncHandler';

const router = Router();
router.get('/sync', asyncHandler(advertisingController.sync));

export default router;
