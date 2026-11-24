# Mini URL Shortener

Dịch vụ rút gọn liên kết & thống kê lượt truy cập (Đề 1).

## Cấu trúc

```
backend/    Express 5 + TypeScript — app.ts, routes/, middlewares/, utils/, data/
frontend/   React 19 + Vite + TypeScript
```

Backend chạy file `.ts` trực tiếp bằng Node 24 (type stripping), không cần bước build. Vì vậy chỉ dùng
cú pháp TypeScript "xoá được": không `enum`, `namespace` hay parameter properties (`tsconfig` đã bật
`erasableSyntaxOnly` để báo lỗi), và import file nội bộ phải ghi đuôi `.ts` (ví dụ `import app from './app.ts'`).

Dữ liệu lưu bằng file JSON (`backend/data/links.json`), log ghi ra `backend/logs/`, backup ra `backend/backups/`.

## Yêu cầu

- Node.js >= 24
- pnpm 12 (`corepack enable` hoặc `npm i -g pnpm`)

## Chạy dự án

```bash
pnpm install
cp backend/.env.example backend/.env   # sửa API_KEY

pnpm dev        # chạy cả backend (http://localhost:3000) và frontend (http://localhost:5173)
pnpm dev:be     # chỉ backend
pnpm dev:fe     # chỉ frontend
```

Frontend proxy `/api` và `/s` sang backend nên không cần cấu hình CORS khi dev.

## Kiểm tra chất lượng

```bash
pnpm lint           # ESLint
pnpm format:check   # Prettier (pnpm format để tự sửa)
pnpm typecheck      # tsc cho backend và frontend
pnpm test           # Vitest + Supertest (backend)
pnpm build          # build frontend
```

Pre-commit hook (husky + lint-staged) tự chạy ESLint/Prettier trên các file được stage.
CI trên GitHub Actions chạy đủ 5 bước trên cho mọi PR; nhánh `main` chỉ nhận merge qua PR khi CI xanh.
