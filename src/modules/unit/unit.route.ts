import { Router } from 'express';
import { unitController } from '@/modules/unit/unit.controller';

const router = Router();

router.get('/sync', unitController.sync);
router.get('/all', unitController.getAll);

export default router;
