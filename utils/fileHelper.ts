import { appendFile, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Đọc và parse file JSON
export async function readJson<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content) as T;
}

// Ghi dữ liệu ra file JSON (tự tạo thư mục cha nếu chưa có)
export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

// Ghi nối tiếp một dòng vào file log (tự tạo thư mục logs/ nếu chưa có)
export async function appendLine(filePath: string, line: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, `${line}\n`, 'utf8');
}

// Đọc toàn bộ các dòng của file text; file chưa tồn tại thì coi như rỗng
export async function readLines(filePath: string): Promise<string[]> {
  try {
    const content = await readFile(filePath, 'utf8');
    return content.split('\n').filter((line) => line.trim() !== '');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

// Sao chép file sang thư mục đích (tự tạo thư mục nếu chưa có)
export async function copyToDir(
  srcFile: string,
  destDir: string,
  destName: string,
): Promise<string> {
  await mkdir(destDir, { recursive: true });
  const destFile = path.join(destDir, destName);
  await copyFile(srcFile, destFile);
  return destFile;
}

// Xếp hàng các thao tác "đọc → sửa → ghi" trên cùng một file để chúng chạy lần lượt.
// Nếu không, hai request đến cùng lúc (vd: 2 người bấm link) sẽ đọc cùng dữ liệu cũ và một lần ghi bị mất.
const queues = new Map<string, Promise<unknown>>();

export function withFileLock<T>(filePath: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(filePath) ?? Promise.resolve();
  const current = previous.then(task, task);
  queues.set(
    filePath,
    current.catch(() => undefined),
  );
  return current;
}
