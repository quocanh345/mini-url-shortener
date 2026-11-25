import { Router } from 'express';
import createLink from '../controllers/createLink.controller.ts';
import { getLink, getAllLinks } from '../controllers/getLink.controller.ts';
import putLink from '../controllers/putLink.controller.ts';
import deleteLink from '../controllers/deleteLink.controller.ts';
import { UpdateDto, CreateDto } from '../middlewares/dto.middleware.ts';

const linkRouter = Router();

linkRouter.get('/links', getAllLinks);
linkRouter.get('/links/:code', getLink);

linkRouter.post('/links', CreateDto, createLink);

linkRouter.put('/links/:code', UpdateDto, putLink);

linkRouter.delete('/links/:code', deleteLink);

export default linkRouter;
