import { Router } from 'express';
import { advertisingController } from '@/modules/advertising/presentation/advertising.controller';
import asyncHandler from '@/shared/utils/asyncHandler';

const router = Router();

router.get('/sync', asyncHandler(advertisingController.sync));

export default router;
