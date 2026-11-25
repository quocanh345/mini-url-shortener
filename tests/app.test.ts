import { copyFile, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';

// Mỗi lần chạy test dùng một bản sao dữ liệu trong thư mục tạm, không đụng vào data/links.json thật.
const SEED_FILE = path.join(import.meta.dirname, '../data/links.json');
const API_KEY = 'test-key';
const RATE_LIMIT_MAX = 3;

let tmpDir: string;
let dataFile: string;
let app: Express;
let resetRateLimiter: () => void;

beforeAll(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'url-shortener-'));
  dataFile = path.join(tmpDir, 'links.json');

  process.env.DATA_FILE = dataFile;
  process.env.LOG_DIR = path.join(tmpDir, 'logs');
  process.env.BACKUP_DIR = path.join(tmpDir, 'backups');
  process.env.API_KEY = API_KEY;
  process.env.RATE_LIMIT_MAX = String(RATE_LIMIT_MAX);

  // import sau khi đặt biến môi trường để config đọc đúng đường dẫn tạm
  app = (await import('../app.ts')).default;
  ({ resetRateLimiter } = await import('../middlewares/rateLimiter.ts'));
});

beforeEach(async () => {
  await copyFile(SEED_FILE, dataFile);
  await rm(path.join(tmpDir, 'logs'), { recursive: true, force: true });
  resetRateLimiter();
});

afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

const api = () => ({
  get: (url: string) => request(app).get(url).set('x-api-key', API_KEY),
  post: (url: string) => request(app).post(url).set('x-api-key', API_KEY),
  put: (url: string) => request(app).put(url).set('x-api-key', API_KEY),
  delete: (url: string) => request(app).delete(url).set('x-api-key', API_KEY),
});

async function readLinks() {
  return JSON.parse(await readFile(dataFile, 'utf8')).data as Array<Record<string, unknown>>;
}

async function waitForFile(file: string): Promise<string> {
  for (let i = 0; i < 50; i++) {
    try {
      return await readFile(file, 'utf8');
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  throw new Error(`File not created: ${file}`);
}

describe('seed data', () => {
  it('has at least 5 sample links', async () => {
    expect((await readLinks()).length).toBeGreaterThanOrEqual(5);
  });
});

describe('GET /s/:code (public redirect)', () => {
  it('redirects to the original URL, increments clicks and writes clicks.log', async () => {
    const before = (await readLinks()).find((l) => l.code === 'node01')!;

    const res = await request(app).get('/s/node01').set('User-Agent', 'vitest-agent');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(before.originalUrl);

    const after = (await readLinks()).find((l) => l.code === 'node01')!;
    expect(after.clicks).toBe((before.clicks as number) + 1);

    const log = await readFile(path.join(tmpDir, 'logs/clicks.log'), 'utf8');
    const entry = JSON.parse(log.trim().split('\n').at(-1)!);
    expect(entry).toMatchObject({ code: 'node01', userAgent: 'vitest-agent' });
    expect(typeof entry.time).toBe('string');
  });

  it('does not require an API key', async () => {
    expect((await request(app).get('/s/node01')).status).toBe(302);
  });

  it('returns 404 for an unknown code', async () => {
    expect((await request(app).get('/s/nope00')).status).toBe(404);
  });

  it('returns 410 for a disabled link and does not count the click', async () => {
    const res = await request(app).get('/s/off123');
    expect(res.status).toBe(410);
    expect((await readLinks()).find((l) => l.code === 'off123')!.clicks).toBe(3);
  });

  it('returns 410 for an expired link', async () => {
    expect((await request(app).get('/s/old999')).status).toBe(410);
  });

  it('does not lose clicks under concurrent requests', async () => {
    await Promise.all(Array.from({ length: 10 }, () => request(app).get('/s/gitHub')));
    expect((await readLinks()).find((l) => l.code === 'gitHub')!.clicks).toBe(8 + 10);
  });
});

describe('apiKeyAuth', () => {
  it('returns 401 without x-api-key', async () => {
    expect((await request(app).get('/api/links')).status).toBe(401);
    expect((await request(app).get('/api/analytics')).status).toBe(401);
  });

  it('returns 401 with a wrong x-api-key', async () => {
    expect((await request(app).get('/api/links').set('x-api-key', 'wrong')).status).toBe(401);
  });
});

describe('/api/links', () => {
  it('GET / lists all links', async () => {
    const res = await api().get('/api/links');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(res.body.total);
  });

  it('GET /:code returns one link or 404', async () => {
    expect((await api().get('/api/links/node01')).body.data.code).toBe('node01');
    expect((await api().get('/api/links/nope00')).status).toBe(404);
  });

  it('POST / creates a link with a random 6-character code', async () => {
    const res = await api().post('/api/links').send({ originalUrl: 'https://example.com/a' });
    expect(res.status).toBe(201);
    expect(res.body.data.code).toMatch(/^[A-Za-z0-9]{6}$/);
    expect(res.body.data).toMatchObject({ active: true, clicks: 0 });
    expect(res.body.data.shortUrl).toMatch(/\/s\/[A-Za-z0-9]{6}$/);
    expect((await readLinks()).some((l) => l.code === res.body.data.code)).toBe(true);
  });

  it('POST / accepts a customCode and rejects duplicates with 409', async () => {
    const body = { originalUrl: 'https://example.com', customCode: 'myCode1' };
    expect((await api().post('/api/links').send(body)).status).toBe(201);
    expect((await api().post('/api/links').send(body)).status).toBe(409);
  });

  it.each<[Record<string, unknown>, string]>([
    [{}, 'missing originalUrl'],
    [{ originalUrl: 'ftp://example.com' }, 'not http/https'],
    [{ originalUrl: 'example.com' }, 'no scheme'],
    [{ originalUrl: 'https://example.com', customCode: 'bad code!' }, 'special characters'],
    [{ originalUrl: 'https://example.com', expirationDate: 'not-a-date' }, 'invalid date'],
    [{ originalUrl: 'https://example.com', expirationDate: '2020-01-01' }, 'date in the past'],
  ])('POST / returns 400 for invalid input (%j: %s)', async (body) => {
    expect((await api().post('/api/links').send(body)).status).toBe(400);
  });

  it('POST / returns 400 when the body is not JSON', async () => {
    const res = await api().post('/api/links').set('content-type', 'text/plain').send('hello');
    expect(res.status).toBe(400);
  });

  it('PUT /:code updates only originalUrl, expirationDate and active', async () => {
    const res = await api()
      .put('/api/links/node01')
      .send({ active: false, originalUrl: 'https://new.example.com', code: 'hack', clicks: 999 });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      code: 'node01',
      active: false,
      originalUrl: 'https://new.example.com',
      clicks: 42,
    });
    expect((await request(app).get('/s/node01')).status).toBe(410);
  });

  it('PUT /:code can re-enable a link and clear its expiration', async () => {
    const res = await api().put('/api/links/old999').send({ expirationDate: null });
    expect(res.status).toBe(200);
    expect((await request(app).get('/s/old999')).status).toBe(302);
  });

  it('PUT /:code returns 400 for invalid data and 404 for unknown code', async () => {
    expect((await api().put('/api/links/node01').send({ active: 'yes' })).status).toBe(400);
    expect((await api().put('/api/links/node01').send({})).status).toBe(400);
    expect((await api().put('/api/links/nope00').send({ active: true })).status).toBe(404);
  });

  it('DELETE /:code removes the link', async () => {
    expect((await api().delete('/api/links/gitHub')).status).toBe(200);
    expect((await api().get('/api/links/gitHub')).status).toBe(404);
    expect((await api().delete('/api/links/gitHub')).status).toBe(404);
  });
});

describe('rateLimiter', () => {
  it(`returns 429 after ${RATE_LIMIT_MAX} POST /api/links in one minute`, async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const res = await api()
        .post('/api/links')
        .send({ originalUrl: `https://example.com/${i}` });
      expect(res.status).toBe(201);
    }
    const res = await api().post('/api/links').send({ originalUrl: 'https://example.com/x' });
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('does not limit GET requests', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX + 2; i++) {
      expect((await api().get('/api/links')).status).toBe(200);
    }
  });
});

describe('/api/analytics', () => {
  it('GET / returns totals and top links sorted by clicks', async () => {
    const res = await api().get('/api/analytics?top=3');
    expect(res.status).toBe(200);
    const links = await readLinks();
    const totalClicks = links.reduce((sum, l) => sum + (l.clicks as number), 0);
    expect(res.body.data).toMatchObject({ totalLinks: links.length, totalClicks });
    expect(res.body.data.topLinks.map((l: { code: string }) => l.code)).toEqual([
      'node01',
      'expr05',
      'mdnJS1',
    ]);
  });

  it('GET /logs aggregates clicks.log', async () => {
    await request(app).get('/s/node01');
    await request(app).get('/s/node01');
    await request(app).get('/s/expr05');

    const res = await api().get('/api/analytics/logs');
    expect(res.status).toBe(200);
    expect(res.body.data.totalClicks).toBe(3);
    expect(res.body.data.clicksByCode[0]).toEqual({ code: 'node01', clicks: 2 });
    expect(res.body.data.recent[0].code).toBe('expr05');
  });

  it('GET /logs works when clicks.log does not exist yet', async () => {
    const res = await api().get('/api/analytics/logs');
    expect(res.status).toBe(200);
    expect(res.body.data.totalClicks).toBe(0);
  });

  it('POST /backup copies data/links.json into backups/', async () => {
    const res = await api().post('/api/analytics/backup');
    expect(res.status).toBe(201);
    const files = await readdir(path.join(tmpDir, 'backups'));
    expect(files).toContain(path.basename(res.body.data.file));
    const backup = await readFile(path.join(tmpDir, 'backups', files[0]!), 'utf8');
    expect(backup).toBe(await readFile(dataFile, 'utf8'));
  });
});

describe('requestLogger', () => {
  it('appends method, url, status and duration to logs/access.log', async () => {
    await request(app).get('/health');
    const log = await waitForFile(path.join(tmpDir, 'logs/access.log'));
    expect(log).toMatch(/GET \/health 200 \d+\.\d+ms/);
  });
});

describe('unknown routes', () => {
  it('returns JSON 404', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
