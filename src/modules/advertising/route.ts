import { Router } from 'express';
import { advertisingController } from '@/modules/advertising/controller/controller';
import asyncHandler from '@/shared/utils/asyncHandler';

const router = Router();

router.get('/sync', asyncHandler(advertisingController.sync));
router.get('/getall', asyncHandler(advertisingController.getAll));

export default router;
