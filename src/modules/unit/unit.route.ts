import { Router } from 'express';
import { unitController } from '@/modules/unit/unit.controller';
import asyncHandler from '@/utils/asyncHandler';

const router = Router();

router.get('/sync', asyncHandler(unitController.sync));
router.get('/all', asyncHandler(unitController.getAll));

export default router;
