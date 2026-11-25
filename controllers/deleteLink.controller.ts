import type { Request, Response } from 'express';
import { linkService } from '../services/link.services.ts';

// DELETE /api/links/:code
export default async function deleteLink(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const deleted = await linkService.deleteLink(req.params.code);
  res.json({ message: 'Link deleted successfully.', data: deleted });
}
