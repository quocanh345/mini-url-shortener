import { clickLogFile, config } from '../config.ts';
import {
  CodeGenerationError,
  LinkExistsError,
  LinkExpiredError,
  LinkInactiveError,
  LinkNotFoundError,
} from '../errors/app.error.ts';
import type {
  ClickLogEntry,
  CreateLinkInput,
  Link,
  LinksFile,
  UpdateLinkInput,
} from '../types/link.ts';
import { generateRandomCode } from '../utils/codeGenerator.ts';
import { appendLine, readJson, withFileLock, writeJson } from '../utils/fileHelper.ts';

const MAX_GENERATE_ATTEMPTS = 5;

async function readLinks(): Promise<Link[]> {
  const file = await readJson<LinksFile>(config.dataFile);
  return file.data;
}

async function saveLinks(links: Link[]): Promise<void> {
  await writeJson(config.dataFile, { data: links } satisfies LinksFile);
}

// Đọc → sửa → ghi trong cùng một "khoá" để các request ghi không đè lên nhau
function mutateLinks<T>(task: (links: Link[]) => T | Promise<T>): Promise<T> {
  return withFileLock(config.dataFile, async () => {
    const links = await readLinks();
    const result = await task(links);
    await saveLinks(links);
    return result;
  });
}

function findIndexOrThrow(links: Link[], code: string): number {
  const index = links.findIndex((link) => link.code === code);
  if (index === -1) throw new LinkNotFoundError(code);
  return index;
}

function isCodeTaken(links: Link[], code: string): boolean {
  return links.some((link) => link.code === code);
}

function generateUniqueCode(links: Link[]): string {
  for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt++) {
    const code = generateRandomCode(config.codeLength);
    if (!isCodeTaken(links, code)) return code;
  }
  throw new CodeGenerationError();
}

export function isExpired(link: Link, now = new Date()): boolean {
  return link.expirationDate ? new Date(link.expirationDate) <= now : false;
}

// Link bị tắt hoặc đã hết hạn thì không được chuyển hướng (410 Gone)
function assertLinkAccessible(link: Link): void {
  if (!link.active) throw new LinkInactiveError(link.code);
  if (isExpired(link)) throw new LinkExpiredError(link.code);
}

export const linkService = {
  getAllLinks(): Promise<Link[]> {
    return readLinks();
  },

  async getLinkByCode(code: string): Promise<Link> {
    const links = await readLinks();
    const link = links.find((item) => item.code === code);
    if (!link) throw new LinkNotFoundError(code);
    return link;
  },

  createLink(input: CreateLinkInput): Promise<Link> {
    return mutateLinks((links) => {
      let code: string;
      if (input.customCode) {
        if (isCodeTaken(links, input.customCode)) throw new LinkExistsError(input.customCode);
        code = input.customCode;
      } else {
        code = generateUniqueCode(links);
      }

      const newLink: Link = {
        code,
        originalUrl: input.originalUrl,
        active: true,
        clicks: 0,
        createdAt: new Date().toISOString(),
        expirationDate: input.expirationDate ?? null,
      };
      links.push(newLink);
      return newLink;
    });
  },

  // Chỉ cập nhật originalUrl, expirationDate, active (đã được middleware lọc sẵn)
  updateLink(code: string, updates: UpdateLinkInput): Promise<Link> {
    return mutateLinks((links) => {
      const index = findIndexOrThrow(links, code);
      const updated: Link = { ...links[index]!, ...updates };
      links[index] = updated;
      return updated;
    });
  },

  deleteLink(code: string): Promise<Link> {
    return mutateLinks((links) => {
      const index = findIndexOrThrow(links, code);
      const [deleted] = links.splice(index, 1);
      return deleted!;
    });
  },

  // Dùng cho GET /s/:code: kiểm tra link, tăng clicks và lưu lại, trả về link sau khi cập nhật
  registerClick(code: string): Promise<Link> {
    return mutateLinks((links) => {
      const index = findIndexOrThrow(links, code);
      const link = links[index]!;
      assertLinkAccessible(link);
      link.clicks += 1;
      return link;
    });
  },

  // Ghi lịch sử truy cập vào logs/clicks.log, mỗi dòng là một JSON
  async logClick(code: string, userAgent: string | undefined): Promise<void> {
    const entry: ClickLogEntry = {
      time: new Date().toISOString(),
      code,
      userAgent: userAgent ?? 'unknown',
    };
    await appendLine(clickLogFile(), JSON.stringify(entry));
  },
};
