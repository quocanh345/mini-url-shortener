import { Router } from 'express';
import linkRouter from './linkRoutes.js';
import redirectRouter from './redirectRoutes.js';

const router = Router();

router.use('/api', linkRouter);
router.use('/s', redirectRouter);

export default router;
