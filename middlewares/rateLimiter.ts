import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.ts';
import { TooManyRequestsError } from '../errors/app.error.ts';

type Bucket = { count: number; windowStart: number };

// Object lưu số lần gọi theo từng client (IP), kết hợp Date.now() để chia theo cửa sổ thời gian
const requestCounts: Record<string, Bucket> = {};

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const { max, windowMs } = config.rateLimit;
  const clientKey = req.ip ?? 'unknown';
  const now = Date.now();

  let bucket = requestCounts[clientKey];
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { count: 0, windowStart: now };
    requestCounts[clientKey] = bucket;
  }

  bucket.count += 1;
  const retryAfterSeconds = Math.ceil((bucket.windowStart + windowMs - now) / 1000);

  res.set('X-RateLimit-Limit', String(max));
  res.set('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));

  if (bucket.count > max) {
    res.set('Retry-After', String(retryAfterSeconds));
    throw new TooManyRequestsError(retryAfterSeconds);
  }
  next();
}

// Dùng trong test để mỗi test bắt đầu với bộ đếm sạch
export function resetRateLimiter(): void {
  for (const key of Object.keys(requestCounts)) delete requestCounts[key];
}
