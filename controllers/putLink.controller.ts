import type { Request, Response } from 'express';
import { linkService } from '../services/link.services.ts';
import type { UpdateLinkInput } from '../types/link.ts';

// PUT /api/links/:code (body đã được validateUpdateLink lọc: chỉ originalUrl, expirationDate, active)
export default async function putLink(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const updates = req.body as UpdateLinkInput;
  const link = await linkService.updateLink(req.params.code, updates);
  res.json({ message: 'Link updated successfully.', data: link });
}
