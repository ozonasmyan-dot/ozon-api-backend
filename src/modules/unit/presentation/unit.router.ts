import { Router } from 'express';
import { unitController } from '@/modules/unit/presentation/unit.controller';
import asyncHandler from '@/shared/utils/asyncHandler';

const router = Router();

router.get('/sync', asyncHandler(unitController.sync));

export default router;
