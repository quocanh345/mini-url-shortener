import { Router } from 'express';
import linkRouter from './linkRoutes.ts';
import redirectRouter from './redirectRoutes.ts';

const router = Router();

router.use('/api', linkRouter);
router.use('/s', redirectRouter);

export default router;
