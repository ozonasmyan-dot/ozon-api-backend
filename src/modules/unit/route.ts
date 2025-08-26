import { Router } from 'express';
import { unitController } from '@/modules/unit/controller/controller';
import asyncHandler from '@/shared/utils/asyncHandler';

const router = Router();

router.get('/sync', asyncHandler(unitController.sync));
router.get('/all', asyncHandler(unitController.getAll));
router.get('/importdata', asyncHandler(unitController.importData));

export default router;
