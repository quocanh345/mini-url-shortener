import { Router } from 'express';
import redirectLink from '../controllers/redirectLink.controller.ts';

const redirectRouter = Router();

redirectRouter.get('/:code', redirectLink);

export default redirectRouter;
