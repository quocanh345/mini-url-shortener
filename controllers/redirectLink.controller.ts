import type { Request, Response } from 'express';
import { linkService } from '../services/link.services.ts';
import {
  LinkExpiredError,
  LinkInactiveError,
  LinkNotFoundError,
} from '../errorHandler/link.error.ts';

async function redirectLink(req: Request, res: Response): Promise<Response | void> {
  const { code } = req.params;

  if (typeof code !== 'string' || !code) {
    return res.status(400).json({ message: 'Invalid code' });
  }

  try {
    const link = await linkService.getLinkByCode(code);
    linkService.assertLinkAccessible(link!); // chắc chắn không bị undefind do đã kiểm tra trong getLinkByCode
    await linkService.updateLink(code, { clicks: link!.clicks + 1 }); // không lấy giá trị trả về vì không cần thiết
    // cần thêm Ghi lịch sử truy cập (thời gian, mã link, req.headers['user-agent']) vào logs/clicks.log.
    return res.redirect(link!.originalUrl);
  } catch (error) {
    if (error instanceof LinkNotFoundError) {
      return res.status(404).json({ message: error.message });
    }
    if (error instanceof LinkInactiveError) {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof LinkExpiredError) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default redirectLink;
