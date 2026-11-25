import { generateRandomCode, readDataFromFile, writeDataToFile } from '../utils/fileHelper.ts';
import type { Database } from '../data/database.ts';
import {
  LinkNotFoundError,
  LinkExsistsError,
  LinkCannotGenerateError,
  FailedToUpdateLinkError,
  FailedToDeleteLinkError,
  LinkExpiredError,
  LinkInactiveError,
} from '../errorHandler/link.error.ts';
import path from 'node:path';

const PATH = path.join(import.meta.dirname, '../data/links.json');

// kiểm tra xem có mã trùng lặp hay không
async function isUniqueCode(code: string, existingData: Database[]): Promise<boolean> {
  return !existingData.find((link: Database) => link.code === code);
}

// sinh mã ngẫu nhiên và kiểm tra tính duy nhất
async function generateUniqueCode(existingData: Database[]): Promise<string | null> {
  let code: string;
  for (let attempts = 0; attempts < 5; attempts++) {
    code = generateRandomCode(6);
    const isUnique = await isUniqueCode(code, existingData);
    if (isUnique) {
      return code;
    }
  }
  return null;
}

class LinkService {
  async createLink(
    originalUrl: string,
    customCode?: string,
    expirationDate?: string,
  ): Promise<Database | undefined> {
    const existingData = await readDataFromFile<{ data: Database[] }>(PATH);
    let code: string | null;
    if (customCode) {
      const isCustomCodeUnique = await isUniqueCode(customCode, existingData.data);
      if (!isCustomCodeUnique) {
        throw new LinkExsistsError();
      }
      code = customCode;
    } else code = await generateUniqueCode(existingData.data);

    if (!code) {
      throw new LinkCannotGenerateError();
    }

    const newLink = {
      originalUrl,
      code: code!,
      active: true,
      clicks: 0,
      expirationDate: expirationDate || undefined,
    };
    await writeDataToFile(PATH, { data: [...existingData.data, newLink] });
    return newLink;
  }

  async getAllLinks(): Promise<Database[] | undefined> {
    const existingData = await readDataFromFile<{ data: Database[] }>(PATH);
    const allLink = existingData.data;
    if (!allLink) {
      throw new LinkNotFoundError();
    }
    return allLink;
  }

  async getLinkByCode(code: string): Promise<Database | undefined> {
    const existingData = await readDataFromFile<{ data: Database[] }>(PATH);
    const link = existingData.data.find((link: Database) => link.code === code);
    if (!link) {
      throw new LinkNotFoundError();
    }
    return link;
  }

  async updateLink(code: string, updates: Partial<Database>): Promise<Database | undefined> {
    const existingData = await readDataFromFile<{ data: Database[] }>(PATH);
    const linkIndex = existingData.data.findIndex((link: Database) => link.code === code);
    if (linkIndex === -1 || !existingData.data[linkIndex]) {
      throw new LinkNotFoundError();
    }
    existingData.data[linkIndex] = { ...existingData.data[linkIndex], ...updates };
    await writeDataToFile(PATH, existingData);
    const updatedLink = existingData.data[linkIndex];
    if (!updatedLink) {
      throw new FailedToUpdateLinkError();
    }
    return updatedLink;
  }

  async deleteLink(code: string): Promise<Database | undefined> {
    const existingData = await readDataFromFile<{ data: Database[] }>(PATH);
    const linkIndex = existingData.data.findIndex((link: Database) => link.code === code);

    if (linkIndex === -1) {
      throw new LinkNotFoundError();
    }

    const [deletedLink] = existingData.data.splice(linkIndex, 1);
    await writeDataToFile(PATH, existingData);
    if (!deletedLink) {
      throw new FailedToDeleteLinkError();
    }
    return deletedLink;
  }

  assertLinkAccessible(link: Database): void {
    if (!link.active) {
      throw new LinkInactiveError();
    }
    if (link.expirationDate) {
      const expirationDate = new Date(link.expirationDate);
      if (expirationDate < new Date()) {
        throw new LinkExpiredError();
      }
    }
  }

  async incrementClicks(code: string): Promise<string> {
    const existingData = await readDataFromFile<{ data: Database[] }>(PATH);
    const linkIndex = existingData.data.findIndex((link: Database) => link.code === code);
    if (linkIndex === -1 || !existingData.data[linkIndex]) {
      throw new LinkNotFoundError();
    }
    existingData.data[linkIndex].clicks += 1;
    await writeDataToFile(PATH, existingData);
    const updatedLink = existingData.data[linkIndex];
    return updatedLink.originalUrl;
  }
  // chưa áp dụng vì nếu việc update gặp lỗi sẽ kéo theo người dùng không thể truy cập link.
}
export const linkService = new LinkService();
