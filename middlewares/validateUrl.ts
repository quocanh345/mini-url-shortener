import type { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../errors/app.error.ts';
import type { CreateLinkInput, UpdateLinkInput } from '../types/link.ts';

// customCode: chỉ chữ cái và chữ số, 3–20 ký tự (không ký tự đặc biệt)
const CUSTOM_CODE_PATTERN = /^[A-Za-z0-9]{3,20}$/;

function getBody(req: Request): Record<string, unknown> {
  const body: unknown = req.body;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ValidationError(
      'Request body must be a JSON object (Content-Type: application/json).',
    );
  }
  return body as Record<string, unknown>;
}

function checkOriginalUrl(value: unknown): string {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || !URL.canParse(value)) {
    throw new ValidationError('originalUrl must be a valid URL starting with http:// or https://');
  }
  return value;
}

function checkCustomCode(value: unknown): string {
  if (typeof value !== 'string' || !CUSTOM_CODE_PATTERN.test(value)) {
    throw new ValidationError(
      'customCode must be 3-20 characters and contain only letters and digits (no special characters).',
    );
  }
  return value;
}

// null = bỏ thời hạn; chuỗi ngày hợp lệ và ở tương lai
function checkExpirationDate(value: unknown): string | null {
  if (value === null) return null;
  const date = typeof value === 'string' ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new ValidationError(
      'expirationDate must be a valid date (e.g. "2026-12-31T23:59:59Z") or null.',
    );
  }
  if (date <= new Date()) {
    throw new ValidationError('expirationDate must be in the future.');
  }
  return date.toISOString();
}

// POST /api/links
export function validateCreateLink(req: Request, _res: Response, next: NextFunction): void {
  const body = getBody(req);
  const input: CreateLinkInput = { originalUrl: checkOriginalUrl(body.originalUrl) };

  if (body.customCode !== undefined && body.customCode !== '') {
    input.customCode = checkCustomCode(body.customCode);
  }
  if (body.expirationDate !== undefined) {
    input.expirationDate = checkExpirationDate(body.expirationDate);
  }

  req.body = input;
  next();
}

// PUT /api/links/:code: chỉ nhận originalUrl, expirationDate, active; các field khác bị bỏ qua
export function validateUpdateLink(req: Request, _res: Response, next: NextFunction): void {
  const body = getBody(req);
  const updates: UpdateLinkInput = {};

  if (body.originalUrl !== undefined) {
    updates.originalUrl = checkOriginalUrl(body.originalUrl);
  }
  if (body.expirationDate !== undefined) {
    updates.expirationDate = checkExpirationDate(body.expirationDate);
  }
  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') {
      throw new ValidationError('active must be true or false.');
    }
    updates.active = body.active;
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('Provide at least one of: originalUrl, expirationDate, active.');
  }

  req.body = updates;
  next();
}
