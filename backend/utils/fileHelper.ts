import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname } from 'path';

// Đọc dữ liệu từ file JSON
export async function readDataFromFile<T>(filePath: string): Promise<T> {
  const data = await readFile(filePath, 'utf8');
  return JSON.parse(data);
}

// Ghi dữ liệu vào file JSON
export async function writeDataToFile<T>(filePath: string, data: T): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(filePath, content, 'utf8');
}

// Sinh mã ngẫu nhiên
export function generateRandomCode(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}
