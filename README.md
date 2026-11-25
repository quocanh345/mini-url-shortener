MINI URL SHORTENER
Dịch vụ rút gọn liên kết & phân tích lượt truy cập (Đề 1)
==========================================================

Dịch vụ rút gọn liên kết tương tự bit.ly ở quy mô nhỏ:
  - đổi URL dài thành link ngắn, ví dụ http://localhost:3000/s/node01
  - tự động chuyển hướng người dùng khi truy cập link ngắn
  - chống spam tạo link bằng giới hạn số lần gọi trong 1 phút
  - chặn link đã hết hạn hoặc đang bị tắt
  - ghi nhận và thống kê lượt truy cập

Công nghệ: Node.js + Express 5 + TypeScript.
Dữ liệu lưu bằng file JSON, đọc/ghi qua node:fs/promises.


1. CÁCH CHẠY
------------

Yêu cầu:
  - Node.js >= 22.18 (khuyến nghị Node 24). Node chạy trực tiếp file .ts nên KHÔNG cần build.
  - npm hoặc pnpm.

Lệnh:

    npm install      cài thư viện
    npm start        chạy server tại http://localhost:3000
    npm run dev      chạy và tự khởi động lại khi sửa code
    npm test         chạy 32 test tự động (Vitest + Supertest)

Thử nhanh: mở trình duyệt vào http://localhost:3000/s/node01
-> trình duyệt được chuyển tới trang Node.js.

Cấu hình (không bắt buộc, đã có giá trị mặc định):
sao chép .env.example thành .env rồi sửa các biến sau.

    Biến                   Mặc định             Ý nghĩa
    ---------------------  -------------------  --------------------------------------------
    PORT                   3000                 Cổng server
    API_KEY                my-secret-api-key    Giá trị header x-api-key cho nhóm /api
    RATE_LIMIT_MAX         5                    Số lần POST /api/links tối đa ...
    RATE_LIMIT_WINDOW_MS   60000                ... trong khoảng thời gian này (1 phút)


2. CẤU TRÚC THƯ MỤC
-------------------

    app.ts                   Cấu hình Express: middleware + router theo thứ tự pipeline
    server.ts                Khởi động server (app.listen)
    config.ts                Cổng, API key, đường dẫn data/logs/backups, giới hạn rate limit

    routes/
      redirectRoutes.ts      GET /s/:code (công khai)
      linkRoutes.ts          /api/links      - CRUD liên kết
      analyticsRoutes.ts     /api/analytics  - thống kê, đọc log, sao lưu

    middlewares/
      requestLogger.ts       Đo thời gian xử lý (res.on('finish')), ghi logs/access.log
      validateUrl.ts         Kiểm tra originalUrl, customCode, expirationDate, active -> 400
      apiKeyAuth.ts          Kiểm tra header x-api-key -> 401
      rateLimiter.ts         Object + Date.now() giới hạn POST /api/links -> 429
      errorHandler.ts        Trả lỗi dạng JSON đúng status code; 404 cho route không tồn tại

    controllers/             Đọc request, gọi service, trả response
    services/                Nghiệp vụ: link.services.ts, analytics.services.ts
    errors/app.error.ts      Các lớp lỗi nghiệp vụ, mỗi lớp mang sẵn HTTP status code
    utils/                   fileHelper.ts (đọc/ghi JSON, appendFile, sao chép), codeGenerator.ts
    types/link.ts            Kiểu dữ liệu Link, cấu trúc file JSON, dòng log

    data/links.json          Dữ liệu (6 bản ghi mẫu)
    logs/                    access.log, clicks.log      (tự tạo khi chạy)
    backups/                 Bản sao lưu links.json      (tự tạo khi gọi API backup)

    tests/app.test.ts        Test tự động cho toàn bộ yêu cầu của đề
    docs/                    Collection để import vào Thunder Client / Postman


Thứ tự xử lý request (pipeline) trong app.ts:

    1. requestLogger            ghi mọi request vào logs/access.log
    2. morgan('dev')            log ra console
    3. express.json()           đọc body JSON
    4. /health, /s/:code        route công khai, không cần API key
    5. /api/*  -> apiKeyAuth    bắt buộc header x-api-key
         /api/links             POST: rateLimiter -> validateCreateLink
                                PUT : validateUpdateLink
         /api/analytics
    6. notFound                 route không tồn tại -> 404
    7. errorHandler             mọi lỗi -> JSON { "error": "..." } kèm status code


3. CẤU TRÚC DỮ LIỆU
-------------------

File data/links.json:

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

Ý nghĩa các trường:

    Trường           Kiểu                  Ghi chú
    ---------------  --------------------  ---------------------------------------------------
    code             string                Mã ngắn, duy nhất (6 ký tự ngẫu nhiên hoặc tự đặt)
    originalUrl      string                URL gốc, bắt đầu bằng http:// hoặc https://
    active           boolean               false = link đang bị tắt
    clicks           number                Số lượt bấm
    createdAt        string (ISO)          Thời điểm tạo
    expirationDate   string (ISO) / null   Hết hạn sau thời điểm này; null = vĩnh viễn

Dữ liệu mẫu (6 link):
    node01, expr05, mdnJS1, gitHub   đang hoạt động
    off123                           đang bị tắt
    old999                           đã hết hạn

File logs/clicks.log - mỗi lượt bấm là một dòng JSON:

    {"time":"2026-11-25T12:59:43.544Z","code":"node01","userAgent":"Mozilla/5.0 ..."}

File logs/access.log - mỗi request là một dòng (thời gian, method, url, status, thời gian xử lý):

    2026-11-25T12:59:43.550Z GET /s/node01 302 15.76ms


4. DANH SÁCH API
----------------

Mọi API dưới /api cần header:   x-api-key: my-secret-api-key
Body gửi dạng JSON:              Content-Type: application/json

    Method  Đường dẫn               Mô tả                                         Mã trả về
    ------  ----------------------  --------------------------------------------  ------------------
    GET     /s/:code                CÔNG KHAI. Tăng clicks, ghi clicks.log,       302, 404, 410
                                    chuyển hướng tới URL gốc
    POST    /api/links              Tạo link. Body: originalUrl (bắt buộc),       201, 400, 401,
                                    customCode, expirationDate                    409, 429
    GET     /api/links              Danh sách toàn bộ link                        200, 401
    GET     /api/links/:code        Chi tiết một link                             200, 401, 404
    PUT     /api/links/:code        Cập nhật originalUrl, expirationDate          200, 400, 401, 404
                                    (hoặc null để bỏ thời hạn), active
    DELETE  /api/links/:code        Xoá link                                      200, 401, 404
    GET     /api/analytics?top=5    Tổng số link, tổng lượt bấm, top link         200, 401
    GET     /api/analytics/logs     Tổng hợp clicks.log: theo mã link, theo       200, 401
                                    ngày, theo user-agent, các lượt gần nhất
    POST    /api/analytics/backup   Sao lưu data/links.json sang                  201, 401
                                    backups/links-<thời gian>.json

Ý nghĩa mã lỗi:
    400  dữ liệu gửi lên sai hoặc thiếu
    401  thiếu hoặc sai x-api-key
    404  không tìm thấy link / route
    409  customCode đã tồn tại
    410  link đã hết hạn hoặc đang bị tắt
    429  gọi POST /api/links quá nhiều lần trong 1 phút

Quy tắc nghiệp vụ & kiểm tra dữ liệu:
  - customCode: 3-20 ký tự, chỉ gồm chữ và số (không ký tự đặc biệt); trùng mã -> 409.
    Không gửi customCode thì hệ thống tự sinh mã ngẫu nhiên 6 ký tự, không trùng.
  - originalUrl phải bắt đầu bằng http:// hoặc https:// và là URL hợp lệ, sai -> 400.
  - expirationDate phải là ngày hợp lệ ở tương lai.
  - Link hết hạn hoặc bị tắt (active = false): truy cập /s/:code trả 410 và không tính lượt bấm.
  - PUT chỉ nhận originalUrl, expirationDate, active. Các trường khác (code, clicks, ...) bị bỏ qua.
  - Rate limit: tối đa 5 lần POST /api/links mỗi phút cho mỗi IP; vượt ngưỡng -> 429,
    kèm header Retry-After (số giây cần chờ).
  - Các thao tác ghi links.json được xếp hàng chạy lần lượt, nên nhiều người bấm link
    cùng lúc vẫn không bị mất lượt đếm.


5. KỊCH BẢN KIỂM THỬ TRÊN THUNDER CLIENT
----------------------------------------

Import file docs/mini-url-shortener.postman_collection.json vào Thunder Client:
    Collections -> Menu -> Import -> Postman
Collection có sẵn biến baseUrl, apiKey và các request đã đánh số theo đúng thứ tự dưới đây.

     #  Request                                                   Kết quả mong đợi
    --  --------------------------------------------------------  ----------------------------------
     1  GET  /s/node01                                            302 -> nodejs.org, clicks tăng 1
     2  GET  /s/off123                                            410 (link bị tắt)
     3  GET  /s/old999                                            410 (link hết hạn)
     4  GET  /s/khongco                                           404
     5  GET  /api/links   (KHÔNG gửi x-api-key)                   401
     6  GET  /api/links                                           200, danh sách 6 link
     7  POST /api/links                                           201, shortUrl =
          {"originalUrl":"https://vnexpress.net",                   http://localhost:3000/s/vnex01
           "customCode":"vnex01"}
     8  Gửi lại request 7                                         409 (trùng mã)
     9  POST /api/links  {"originalUrl":"vnexpress.net"}          400 (thiếu http/https)
    10  POST /api/links                                           400 (ký tự đặc biệt)
          {"originalUrl":"https://a.com","customCode":"ab@#"}
    11  POST /api/links  {"originalUrl":"https://dantri.com.vn"}  201, mã ngẫu nhiên 6 ký tự
    12  GET  /api/links/vnex01                                    200
    13  PUT  /api/links/vnex01  {"active":false}                  200
        rồi GET /s/vnex01                                         410
    14  PUT  /api/links/old999  {"expirationDate":null}           200
        rồi GET /s/old999                                         302 (chuyển hướng được)
    15  DELETE /api/links/vnex01                                  200
        rồi GET /api/links/vnex01                                 404
    16  POST /api/links liên tục hơn 5 lần trong 1 phút           từ lần thứ 6: 429
    17  GET  /api/analytics?top=3                                 200: totalLinks, totalClicks,
                                                                  topLinks giảm dần theo clicks
    18  GET  /api/analytics/logs                                  200: tổng hợp lượt bấm bước 1, 14
    19  POST /api/analytics/backup                                201, có file mới trong backups/
    20  Mở logs/access.log và logs/clicks.log                     có dòng log của các request trên

Muốn chạy lại kịch bản từ đầu: khôi phục data/links.json (lấy từ một file trong backups/)
và chờ 1 phút để bộ đếm rate limit được làm mới.


6. KIỂM TRA CHẤT LƯỢNG CODE
---------------------------

    npm run lint           ESLint
    npm run format:check   Prettier
    npm run typecheck      TypeScript
    npm test               32 test tự động: redirect, CRUD, validate, 401, 429,
                           analytics, log, backup

GitHub Actions chạy đủ 4 bước trên cho mọi Pull Request;
nhánh main chỉ nhận merge qua PR khi CI xanh.
