import { Router } from 'express';
import redirectLink from '../controllers/redirectLink.controller.ts';

// Gắn tại /s, công khai cho mọi trình duyệt (không cần API key)
const redirectRouter = Router();

redirectRouter.get('/:code', redirectLink);

export default redirectRouter;
