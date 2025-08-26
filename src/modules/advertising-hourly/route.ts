import {Router} from 'express';
import {advertisingHourlyController} from '@/modules/advertising-hourly/controller/controller';
import asyncHandler from '@/shared/utils/asyncHandler';

const router = Router();
router.get('/', asyncHandler(advertisingHourlyController.getAll));

export default router;
