import { Router } from 'express';
import { advertisingController } from '@/modules/advertising/advertising.controller';

const router = Router();
router.get('/sync', advertisingController.sync);

export default router;
