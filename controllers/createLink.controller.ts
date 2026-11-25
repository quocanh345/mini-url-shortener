import type { Request, Response } from 'express';
import { linkService } from '../services/link.services.ts';
import type { CreateLinkInput } from '../types/link.ts';

// POST /api/links (body đã được validateCreateLink kiểm tra và lọc)
export default async function createLink(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateLinkInput;
  const link = await linkService.createLink(input);
  const shortUrl = `${req.protocol}://${req.get('host')}/s/${link.code}`;
  res.status(201).json({ message: 'Link created successfully.', data: { ...link, shortUrl } });
}
