import { linkService } from '../services/link.services.ts';
import type { Request, Response } from 'express';
import { LinkExsistsError, LinkCannotGenerateError } from '../errorHandler/link.error.ts';

async function createLink(req: Request, res: Response): Promise<Response> {
  try {
    const { originalUrl, customCode, expirationDate } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'Original URL is required.' });
    }

    const newLink = await linkService.createLink(originalUrl, customCode, expirationDate);
    return res.status(201).json({ message: 'Link created successfully.', newLink });
  } catch (error) {
    if (error instanceof LinkExsistsError) {
      return res.status(409).json({ error: error.message });
    }
    if (error instanceof LinkCannotGenerateError) {
      return res.status(500).json({ error: error.message });
    }
    console.error('Error in createLink controller:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export default createLink;
