# Mini URL Shortener: Dịch vụ rút gọn liên kết & phân tích lượt truy cập (Đề 1)

Dịch vụ rút gọn liên kết tương tự bit.ly ở quy mô nhỏ:

- đổi URL dài thành link ngắn (ví dụ `http://localhost:3000/s/node01`);
- tự động chuyển hướng khi có người truy cập;
- chống spam tạo link bằng giới hạn tần suất;
- chặn link đã hết hạn hoặc bị tắt;
- ghi nhận và thống kê lượt truy cập.

Công nghệ: **Node.js + Express 5 + TypeScript**, dữ liệu lưu bằng **file JSON** (`node:fs/promises`).

## 1. Yêu cầu & cách chạy

- **Node.js ≥ 22.18** (khuyến nghị Node 24). Node chạy trực tiếp file `.ts` nên **không cần bước build**.
- Trình quản lý gói: `npm` hoặc `pnpm` đều được.

```bash
npm install          # hoặc: pnpm install
npm start            # chạy server: http://localhost:3000
npm run dev          # chạy và tự khởi động lại khi sửa code
npm test             # chạy 32 test tự động (Vitest + Supertest)
```

Thử ngay trên trình duyệt: <http://localhost:3000/s/node01>, trình duyệt sẽ được chuyển tới trang Node.js.

**Cấu hình** (không bắt buộc): sao chép `.env.example` thành `.env` để đổi các giá trị sau.

| Biến                   | Mặc định            | Ý nghĩa                                    |
| ---------------------- | ------------------- | ------------------------------------------ |
| `PORT`                 | `3000`              | Cổng server                                |
| `API_KEY`              | `my-secret-api-key` | Giá trị header `x-api-key` cho nhóm `/api` |
| `RATE_LIMIT_MAX`       | `5`                 | Số lần `POST /api/links` tối đa…           |
| `RATE_LIMIT_WINDOW_MS` | `60000`             | …trong khoảng thời gian này (1 phút)       |

## 2. Cấu trúc thư mục

```
app.ts                  Cấu hình Express: middleware + router theo đúng thứ tự pipeline
server.ts               Khởi động server (app.listen)
config.ts               Cổng, API key, đường dẫn data/logs/backups, giới hạn rate limit
routes/
  redirectRoutes.ts     GET /s/:code (công khai)
  linkRoutes.ts         /api/links: CRUD liên kết
  analyticsRoutes.ts    /api/analytics: thống kê, đọc log, sao lưu
middlewares/
  requestLogger.ts      Đo thời gian xử lý (res.on('finish')) → logs/access.log
  validateUrl.ts        Kiểm tra originalUrl, customCode, expirationDate, active → 400
  apiKeyAuth.ts         Kiểm tra header x-api-key → 401
  rateLimiter.ts        Object + Date.now() giới hạn POST /api/links → 429
  errorHandler.ts       Trả lỗi dạng JSON với status code tương ứng; 404 cho route lạ
controllers/            Đọc request, gọi service, trả response
services/               Nghiệp vụ: link.services.ts, analytics.services.ts
errors/app.error.ts     Các lớp lỗi nghiệp vụ, mỗi lớp mang sẵn HTTP status code
utils/                  fileHelper.ts (đọc/ghi JSON, appendFile, sao chép), codeGenerator.ts
types/link.ts           Kiểu dữ liệu Link, cấu trúc file JSON, dòng log
data/links.json         Dữ liệu (6 bản ghi mẫu)
logs/                   access.log, clicks.log (tự tạo khi chạy)
backups/                Bản sao lưu links.json (tự tạo khi gọi API backup)
tests/app.test.ts       Test tự động cho toàn bộ yêu cầu của đề
docs/                   Collection để import vào Thunder Client / Postman
```

### Pipeline trong `app.ts`

```
requestLogger → morgan('dev') → express.json()
  → /health, /s/:code (công khai)
  → /api/* : apiKeyAuth
      → /api/links      (POST: rateLimiter → validateCreateLink; PUT: validateUpdateLink)
      → /api/analytics
  → notFound (404) → errorHandler
```

## 3. Cấu trúc dữ liệu

**`data/links.json`**

```json
{
  "data": [
    {
      "code": "node01",
      "originalUrl": "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs",
      "active": true,
      "clicks": 42,
      "createdAt": "2026-11-01T08:00:00.000Z",
      "expirationDate": null
    }
  ]
}
```

| Trường           | Kiểu                 | Ghi chú                                            |
| ---------------- | -------------------- | -------------------------------------------------- |
| `code`           | string               | Mã ngắn, duy nhất (6 ký tự ngẫu nhiên hoặc tự đặt) |
| `originalUrl`    | string               | URL gốc, bắt đầu bằng `http://` hoặc `https://`    |
| `active`         | boolean              | `false` = link bị tắt                              |
| `clicks`         | number               | Số lượt bấm                                        |
| `createdAt`      | string (ISO)         | Thời điểm tạo                                      |
| `expirationDate` | string (ISO) \| null | Hết hạn sau thời điểm này; `null` = vĩnh viễn      |

Dữ liệu mẫu gồm 6 link: `node01`, `expr05`, `mdnJS1`, `gitHub` (đang hoạt động), `off123` (**bị tắt**) và `old999` (**đã hết hạn**).

**`logs/clicks.log`**: mỗi lượt bấm là một dòng JSON:

```
{"time":"2026-11-25T12:59:43.544Z","code":"node01","userAgent":"Mozilla/5.0 ..."}
```

**`logs/access.log`**: mỗi request là một dòng:

```
2026-11-25T12:59:43.550Z GET /s/node01 302 15.76ms
```

## 4. Danh sách API

Mọi API dưới `/api` yêu cầu header **`x-api-key: my-secret-api-key`**. Body gửi dạng JSON (`Content-Type: application/json`).

| Method | Đường dẫn               | Mô tả                                                                     | Mã trả về               |
| ------ | ----------------------- | ------------------------------------------------------------------------- | ----------------------- |
| GET    | `/s/:code`              | **Công khai**. Tăng `clicks`, ghi `clicks.log`, chuyển hướng tới URL gốc  | 302, 404, 410           |
| POST   | `/api/links`            | Tạo link. Body: `originalUrl` (bắt buộc), `customCode`, `expirationDate`  | 201, 400, 401, 409, 429 |
| GET    | `/api/links`            | Danh sách toàn bộ link                                                    | 200, 401                |
| GET    | `/api/links/:code`      | Chi tiết một link                                                         | 200, 401, 404           |
| PUT    | `/api/links/:code`      | Cập nhật `originalUrl`, `expirationDate` (hoặc `null`), `active`          | 200, 400, 401, 404      |
| DELETE | `/api/links/:code`      | Xoá link                                                                  | 200, 401, 404           |
| GET    | `/api/analytics?top=5`  | Tổng số link, tổng lượt bấm, top link nhiều lượt truy cập nhất            | 200, 401                |
| GET    | `/api/analytics/logs`   | Tổng hợp `clicks.log`: theo mã link, theo ngày, user-agent, lượt gần nhất | 200, 401                |
| POST   | `/api/analytics/backup` | Sao lưu `data/links.json` sang `backups/links-<thời gian>.json`           | 201, 401                |

**Quy tắc nghiệp vụ & kiểm tra dữ liệu**

- `customCode`: 3–20 ký tự, chỉ chữ và số (không ký tự đặc biệt); trùng mã → **409**. Không gửi thì hệ thống tự sinh mã ngẫu nhiên 6 ký tự, không trùng.
- `originalUrl` phải bắt đầu bằng `http://` hoặc `https://` và là URL hợp lệ → nếu sai trả **400**.
- `expirationDate` phải là ngày hợp lệ ở tương lai. Link hết hạn hoặc bị tắt (`active: false`) khi truy cập `/s/:code` trả **410 Gone** và không tính lượt bấm.
- `PUT` chỉ nhận `originalUrl`, `expirationDate`, `active`; các trường khác (`code`, `clicks`…) bị bỏ qua.
- Rate limit: tối đa 5 lần `POST /api/links` mỗi phút cho mỗi IP; vượt ngưỡng trả **429** kèm header `Retry-After`.
- Các thao tác ghi `links.json` được xếp hàng lần lượt, nên nhiều người bấm link cùng lúc vẫn không mất lượt đếm.
- Lỗi luôn trả JSON dạng `{ "error": "..." }`.

## 5. Kịch bản kiểm thử trên Thunder Client

Import file [`docs/mini-url-shortener.postman_collection.json`](docs/mini-url-shortener.postman_collection.json) vào Thunder Client: **Collections → Menu → Import → Postman**. Collection có sẵn biến `baseUrl` và `apiKey`, các request đã được đánh số theo đúng thứ tự dưới đây.

| #   | Request                                                                           | Kết quả mong đợi                                      |
| --- | --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | `GET /s/node01`                                                                   | 302 → trang nodejs.org; `clicks` của node01 tăng 1    |
| 2   | `GET /s/off123`                                                                   | 410 (link bị tắt)                                     |
| 3   | `GET /s/old999`                                                                   | 410 (link hết hạn)                                    |
| 4   | `GET /s/khongco`                                                                  | 404                                                   |
| 5   | `GET /api/links` **không** có header `x-api-key`                                  | 401                                                   |
| 6   | `GET /api/links` (có key)                                                         | 200, danh sách 6 link                                 |
| 7   | `POST /api/links` `{"originalUrl":"https://vnexpress.net","customCode":"vnex01"}` | 201, `shortUrl` = `http://localhost:3000/s/vnex01`    |
| 8   | Gửi lại request 7                                                                 | 409 (trùng mã)                                        |
| 9   | `POST /api/links` `{"originalUrl":"vnexpress.net"}`                               | 400 (URL không có http/https)                         |
| 10  | `POST /api/links` `{"originalUrl":"https://a.com","customCode":"ab@#"}`           | 400 (ký tự đặc biệt)                                  |
| 11  | `POST /api/links` `{"originalUrl":"https://dantri.com.vn"}`                       | 201, mã ngẫu nhiên 6 ký tự                            |
| 12  | `GET /api/links/vnex01`                                                           | 200                                                   |
| 13  | `PUT /api/links/vnex01` `{"active":false}`, rồi mở `/s/vnex01`                    | 200, sau đó `/s/vnex01` trả 410                       |
| 14  | `PUT /api/links/old999` `{"expirationDate":null}`, rồi mở `/s/old999`             | 200, sau đó `/s/old999` chuyển hướng được (302)       |
| 15  | `DELETE /api/links/vnex01`, rồi `GET /api/links/vnex01`                           | 200, sau đó 404                                       |
| 16  | Gửi `POST /api/links` liên tục > 5 lần trong 1 phút                               | Từ lần thứ 6: 429 Too Many Requests                   |
| 17  | `GET /api/analytics?top=3`                                                        | 200, `totalLinks`, `totalClicks`, `topLinks` giảm dần |
| 18  | `GET /api/analytics/logs`                                                         | 200, tổng hợp các lượt bấm ở bước 1, 14               |
| 19  | `POST /api/analytics/backup`                                                      | 201, có file mới trong `backups/`                     |
| 20  | Mở `logs/access.log` và `logs/clicks.log`                                         | Có dòng log tương ứng các request ở trên              |

> Muốn chạy lại kịch bản từ đầu: khôi phục `data/links.json` (từ một file trong `backups/`) và chờ 1 phút để bộ đếm rate limit được làm mới.

## 6. Kiểm tra chất lượng (dành cho phát triển)

```bash
npm run lint          # ESLint
npm run format:check  # Prettier
npm run typecheck     # TypeScript
npm test              # 32 test tự động: redirect, CRUD, validate, 401, 429, analytics, log, backup
```

GitHub Actions chạy đủ 4 bước trên cho mọi Pull Request; nhánh `main` chỉ nhận merge qua PR khi CI xanh.
