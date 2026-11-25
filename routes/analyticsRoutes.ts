import { Router } from 'express';
import { backupLinks, getClickLogs, getSummary } from '../controllers/analytics.controller.ts';

// Gắn tại /api/analytics (đã qua apiKeyAuth ở app.ts)
const analyticsRouter = Router();

analyticsRouter.get('/', getSummary);
analyticsRouter.get('/logs', getClickLogs);
analyticsRouter.post('/backup', backupLinks);

export default analyticsRouter;
