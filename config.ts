import path from 'node:path';

// Mọi đường dẫn tính theo thư mục dự án (nơi chứa file này), không phụ thuộc thư mục đang đứng khi chạy lệnh.
// Có thể ghi đè bằng biến môi trường (file .env), test dùng cách này để không đụng vào dữ liệu thật.
const ROOT = import.meta.dirname;

function resolveFromRoot(value: string | undefined, fallback: string): string {
  return path.resolve(ROOT, value ?? fallback);
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  apiKey: process.env.API_KEY || 'my-secret-api-key',

  dataFile: resolveFromRoot(process.env.DATA_FILE, 'data/links.json'),
  logDir: resolveFromRoot(process.env.LOG_DIR, 'logs'),
  backupDir: resolveFromRoot(process.env.BACKUP_DIR, 'backups'),

  codeLength: 6,
  // Giới hạn số lần gọi POST /api/links trong một khoảng thời gian (mặc định 5 lần / 1 phút)
  rateLimit: {
    max: Number(process.env.RATE_LIMIT_MAX) || 5,
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  },
};

export const accessLogFile = () => path.join(config.logDir, 'access.log');
export const clickLogFile = () => path.join(config.logDir, 'clicks.log');
