import type { Request, Response, NextFunction } from 'express';
import { InvalidData } from '../errorHandler/link.error.ts';

const MAXLENGTH = 10;

export function UpdateDto(req: Request, res: Response, next: NextFunction) {
  try {
    const { originalURL, active, expirationDate } = req.body;
    let dto = {};
    if (originalURL) dto = { ...dto, originalURL };
    if (active) dto = { ...dto, active };
    if (expirationDate) {
      const date = new Date(expirationDate);
      if (!isNaN(date.getTime())) dto = { ...dto, expirationDate };
      else throw new InvalidData();
    }
    req.body = dto;
    next();
  } catch (error) {
    if (error instanceof InvalidData) res.status(400).json({ message: 'Data is invalid' });
    console.error('Error in putLink controller:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export function CreateDto(req: Request, res: Response, next: NextFunction) {
  try {
    const { originalURL, expirationDate, code } = req.body;
    let dto = {};
    if (!originalURL) throw new InvalidData();
    else dto = { ...dto, originalURL };
    if (code && code.length <= MAXLENGTH) dto = { ...dto, code };
    if (expirationDate) {
      const date = new Date(expirationDate);
      if (!isNaN(date.getTime())) dto = { ...dto, expirationDate };
      else throw new InvalidData();
    }
    req.body = dto;
    next();
  } catch (error) {
    if (error instanceof InvalidData) res.status(400).json({ message: 'Data is invalid' });
    console.error('Error in putLink controller:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
