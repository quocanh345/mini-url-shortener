import type { Request, Response } from 'express';
import { linkService } from '../services/link.services.ts';

// GET /api/links
export async function getAllLinks(_req: Request, res: Response): Promise<void> {
  const links = await linkService.getAllLinks();
  res.json({ total: links.length, data: links });
}

// GET /api/links/:code
export async function getLink(req: Request<{ code: string }>, res: Response): Promise<void> {
  const link = await linkService.getLinkByCode(req.params.code);
  res.json({ data: link });
}
