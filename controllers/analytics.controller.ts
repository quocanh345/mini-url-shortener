import type { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.services.ts';

function readPositiveInt(value: unknown, fallback: number, max: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
}

// GET /api/analytics?top=5
export async function getSummary(req: Request, res: Response): Promise<void> {
  const top = readPositiveInt(req.query.top, 5, 100);
  res.json({ data: await analyticsService.getSummary(top) });
}

// GET /api/analytics/logs?recent=10
export async function getClickLogs(req: Request, res: Response): Promise<void> {
  const recent = readPositiveInt(req.query.recent, 10, 500);
  res.json({ data: await analyticsService.getClickLogs(recent) });
}

// POST /api/analytics/backup
export async function backupLinks(_req: Request, res: Response): Promise<void> {
  const backup = await analyticsService.backupLinks();
  res.status(201).json({ message: 'Backup created successfully.', data: backup });
}
