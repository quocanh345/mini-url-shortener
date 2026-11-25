import { linkService } from '../services/link.services.ts';
import { LinkNotFoundError } from '../errorHandler/link.error.ts';
import type { Request, Response } from 'express';

async function deleteLink(req: Request, res: Response): Promise<Response> {
  const { code } = req.params;

  if (typeof code !== 'string' || !code) {
    return res.status(400).json({ message: 'Invalid code' });
  }

  try {
    const deletedLink = await linkService.deleteLink(code);
    return res.status(200).json({ message: 'Link deleted successfully.', deletedLink });
  } catch (error) {
    if (error instanceof LinkNotFoundError) {
      return res.status(404).json({ message: 'Link not found.' });
    }
    console.error('Error in deleteLink controller:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export default deleteLink;
