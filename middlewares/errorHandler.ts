import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app.error.ts';

// Không route nào khớp → 404 dạng JSON
export function notFound(req: Request, res: Response): void {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
}

// Middleware xử lý lỗi tập trung (phải có đủ 4 tham số để Express nhận ra)
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Body JSON sai cú pháp (do express.json() ném ra)
  if (err instanceof SyntaxError && (err as SyntaxError & { status?: number }).status === 400) {
    res.status(400).json({ error: 'Malformed JSON body.' });
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error.' });
}
