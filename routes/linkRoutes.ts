import { Router } from 'express';
import createLink from '../controllers/createLink.controller.ts';
import deleteLink from '../controllers/deleteLink.controller.ts';
import { getAllLinks, getLink } from '../controllers/getLink.controller.ts';
import putLink from '../controllers/putLink.controller.ts';
import { rateLimiter } from '../middlewares/rateLimiter.ts';
import { validateCreateLink, validateUpdateLink } from '../middlewares/validateUrl.ts';

// Gắn tại /api/links (đã qua apiKeyAuth ở app.ts)
const linkRouter = Router();

linkRouter.post('/', rateLimiter, validateCreateLink, createLink);
linkRouter.get('/', getAllLinks);
linkRouter.get('/:code', getLink);
linkRouter.put('/:code', validateUpdateLink, putLink);
linkRouter.delete('/:code', deleteLink);

export default linkRouter;
