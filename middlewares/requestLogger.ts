import { appendFile, mkdir } from 'node:fs/promises';
import type { NextFunction, Request, Response } from 'express';
import { accessLogFile, config } from '../config.ts';

// Đo thời gian xử lý mỗi request (bắt đầu → res 'finish') và ghi nối tiếp vào logs/access.log
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const line = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(2)}ms\n`;

    // Ghi log không được làm hỏng response, nên chỉ in lỗi ra console
    mkdir(config.logDir, { recursive: true })
      .then(() => appendFile(accessLogFile(), line, 'utf8'))
      .catch((error: unknown) => console.error('Cannot write access log:', error));
  });

  next();
}
