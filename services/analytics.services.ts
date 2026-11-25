import path from 'node:path';
import { clickLogFile, config } from '../config.ts';
import type { ClickLogEntry, Link, LinksFile } from '../types/link.ts';
import { copyToDir, readJson, readLines, withFileLock } from '../utils/fileHelper.ts';
import { isExpired } from './link.services.ts';

function parseClickLine(line: string): ClickLogEntry | null {
  try {
    const entry = JSON.parse(line) as Partial<ClickLogEntry>;
    if (typeof entry.time !== 'string' || typeof entry.code !== 'string') return null;
    return { time: entry.time, code: entry.code, userAgent: entry.userAgent ?? 'unknown' };
  } catch {
    return null; // bỏ qua dòng hỏng thay vì làm hỏng cả API
  }
}

// Đếm số lần xuất hiện theo khoá, sắp xếp giảm dần
function countBy<T>(items: T[], key: (item: T) => string) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export const analyticsService = {
  // GET /api/analytics: tổng số link, tổng lượt bấm, top link
  async getSummary(top: number) {
    const { data: links } = await readJson<LinksFile>(config.dataFile);
    const now = new Date();

    const activeLinks = links.filter((link) => link.active && !isExpired(link, now));
    const totalClicks = links.map((link) => link.clicks).reduce((sum, n) => sum + n, 0);
    const topLinks = links
      .filter((link) => link.clicks > 0)
      .sort((a: Link, b: Link) => b.clicks - a.clicks)
      .slice(0, top)
      .map(({ code, originalUrl, clicks }) => ({ code, originalUrl, clicks }));

    return {
      totalLinks: links.length,
      activeLinks: activeLinks.length,
      disabledLinks: links.filter((link) => !link.active).length,
      expiredLinks: links.filter((link) => isExpired(link, now)).length,
      totalClicks,
      topLinks,
    };
  },

  // GET /api/analytics/logs: đọc logs/clicks.log và tổng hợp
  async getClickLogs(recent: number) {
    const lines = await readLines(clickLogFile());
    const entries = lines.map(parseClickLine).filter((e): e is ClickLogEntry => e !== null);

    return {
      totalClicks: entries.length,
      clicksByCode: countBy(entries, (e) => e.code).map(({ name, count }) => ({
        code: name,
        clicks: count,
      })),
      clicksByDay: countBy(entries, (e) => e.time.slice(0, 10)).map(({ name, count }) => ({
        date: name,
        clicks: count,
      })),
      topUserAgents: countBy(entries, (e) => e.userAgent)
        .slice(0, 5)
        .map(({ name, count }) => ({ userAgent: name, clicks: count })),
      recent: entries.slice(-recent).reverse(),
    };
  },

  // POST /api/analytics/backup: sao lưu data/links.json sang backups/
  async backupLinks() {
    const createdAt = new Date();
    const stamp = createdAt.toISOString().replace(/[:.]/g, '-');
    const fileName = `links-${stamp}.json`;
    // Dùng chung khoá với các thao tác ghi để không sao lưu đúng lúc file đang được ghi dở
    await withFileLock(config.dataFile, () =>
      copyToDir(config.dataFile, config.backupDir, fileName),
    );
    return {
      file: `${path.basename(config.backupDir)}/${fileName}`,
      createdAt: createdAt.toISOString(),
    };
  },
};
