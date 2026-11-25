import { LinkNotFoundError } from '../errorHandler/link.error.ts';
import { linkService } from '../services/link.services.ts';
import type { Request, Response } from 'express';

async function getLink(req: Request, res: Response): Promise<Response> {
  const { code } = req.params;

  if (typeof code !== 'string' || !code) {
    return res.status(400).json({ message: 'Invalid code' });
  }

  try {
    const link = await linkService.getLinkByCode(code);
    return res.status(200).json(link);
  } catch (error) {
    if (error instanceof LinkNotFoundError) {
      return res.status(404).json({ message: 'Link not found.' });
    }
    console.error('Error in getLink controller:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getAllLinks(_req: Request, res: Response): Promise<Response> {
  try {
    const links = await linkService.getAllLinks();
    return res.status(200).json(links);
  } catch (error) {
    if (error instanceof LinkNotFoundError) {
      return res.status(404).json({ message: 'Data not found.' });
    }
    console.error('Error in getAllLinks controller:', error);
    return res.status(500).json({ message: 'Internal server error.' }); // tạm thời, sau này phải sửa cho đúng status.
  }
}

export { getLink, getAllLinks };
