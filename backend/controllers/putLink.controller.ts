import { LinkNotFoundError } from '../errorHandler/link.error.ts';
import { linkService } from '../services/link.services.ts';
import type { Request, Response } from 'express';

async function putLink(req: Request, res: Response): Promise<Response> {
  const { code } = req.params;
  const updateDto = req.body;

  if (typeof code !== 'string' || !code) {
    return res.status(400).json({ message: 'Invalid code' });
  }

  try {
    const updatedLink = await linkService.updateLink(code, updateDto);
    return res.status(200).json({ message: 'Link updated successfully.', updatedLink });
  } catch (error) {
    if (error instanceof LinkNotFoundError) {
      return res.status(404).json({ message: 'Link not found.' });
    }
    console.error('Error in putLink controller:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export default putLink;
