import type { Request, Response } from 'express';
import { linkService } from '../services/link.services.ts';

// GET /s/:code (công khai)
// registerClick: tìm link (404), kiểm tra bị tắt / hết hạn (410), tăng clicks và lưu vào data/links.json
export default async function redirectLink(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const { code } = req.params;
  const link = await linkService.registerClick(code);

  // Ghi log lỗi không được chặn người dùng vào link, nên chỉ in lỗi ra console
  try {
    await linkService.logClick(code, req.get('user-agent'));
  } catch (error) {
    console.error('Cannot write click log:', error);
  }

  res.redirect(link.originalUrl);
}
