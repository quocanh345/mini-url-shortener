import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.ts';
import { UnauthorizedError } from '../errors/app.error.ts';

// Bảo vệ /api/links và /api/analytics: thiếu hoặc sai header x-api-key → 401
export function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  const apiKey = req.get('x-api-key');
  if (!apiKey || apiKey !== config.apiKey) {
    throw new UnauthorizedError();
  }
  next();
}
