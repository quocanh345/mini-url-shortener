HƯỚNG DẪN NỘP BÀI
- Hình thức nộp: Tải trực tiếp toàn bộ thư mục dự án lên đúng thư mục cá nhân của sinh viên trên Google Drive đã được chia sẻ.
- Quy định đặt tên thư mục dự án: BTMR_B1234_D<mã đề> (ví dụ: làm Đề 1 đặt tên là BTMR_B1234_D1).
- Thời hạn nộp bài 0h ngày 26/11/2026
- Lưu ý: Tuyệt đối loại bỏ thư mục thư viện (node_modules/) trước khi tải lên Drive !!!
ĐỀ 1: DỊCH VỤ RÚT GỌN LIÊN KẾT & PHÂN TÍCH LƯỢT TRUY CẬP (MINI URL SHORTENER)
1. Vấn đề thực tế
Xây dựng dịch vụ rút gọn liên kết tương tự bit.ly ở quy mô nhỏ: chuyển đổi các đường dẫn URL dài thành đường dẫn ngắn gọn (ví dụ: http://localhost:3000/s/node01), tự động chuyển hướng người dùng khi truy cập, chống spam tạo liên kết, kiểm soát các liên kết đã hết hạn hoặc bị tạm khóa, đồng thời ghi nhận và thống kê lượt truy cập theo thời gian thực.
2. Yêu cầu đặt ra
a) Cấu hình ứng dụng (app.js):
   - Kích hoạt middleware express.json() và morgan('dev').
   - Gắn đầy đủ các router và middleware theo đúng thứ tự xử lý (Pipeline).
b) Định tuyến bằng express.Router() (03 module trong thư mục routes/):
   - redirectRoutes.js (GET /s/:code):
     + Tìm liên kết theo req.params.code trong data/links.json.
     + Trả về 404 nếu mã không tồn tại; trả về 410 (hoặc 400) nếu liên kết đã hết hạn hoặc đang bị tắt.
     + Tăng số lượt bấm (clicks) và lưu cập nhật vào data/links.json.
     + Ghi lịch sử truy cập (thời gian, mã link, req.headers['user-agent']) vào logs/clicks.log.
     + Chuyển hướng người dùng tới đường dẫn gốc bằng res.redirect(originalUrl).
   - linkRoutes.js (gắn tại /api/links):
     + POST /: Tạo liên kết ngắn mới (tự sinh mã ngẫu nhiên 6 ký tự hoặc nhận customCode từ body; kiểm tra chống trùng mã).
     + GET /: Lấy danh sách toàn bộ liên kết.
     + GET /:code: Xem thông tin chi tiết một liên kết.
     + PUT /:code: Cập nhật đường dẫn gốc (originalUrl), thời hạn hoặc trạng thái bật/tắt.
     + DELETE /:code: Xóa liên kết khỏi hệ thống.
   - analyticsRoutes.js (gắn tại /api/analytics):
     + GET /: Thống kê tổng số liên kết, tổng lượt bấm và danh sách top liên kết có lượt truy cập cao nhất (sử dụng filter / map).
     + GET /logs: Đọc và tổng hợp lịch sử truy cập từ tệp logs/clicks.log.
     + POST /backup: Sao lưu tệp data/links.json sang thư mục backups/.
c) Chuỗi Middleware (thư mục middlewares/):
   - requestLogger: Đo thời gian xử lý mỗi request bằng res.on('finish') và ghi nối tiếp vào logs/access.log bằng fs.appendFile (tự tạo thư mục logs/ bằng fs.mkdir với tùy chọn { recursive: true }).
   - validateUrl: Kiểm tra originalUrl hợp lệ (bắt đầu bằng http:// hoặc https://) và customCode không chứa ký tự đặc biệt; trả về 400 nếu sai định dạng.
   - apiKeyAuth: Kiểm tra header x-api-key để bảo vệ nhóm /api/links và /api/analytics (thiếu hoặc sai key trả về 401); riêng route GET /s/:code mở công khai cho mọi trình duyệt.
   - rateLimiter (nâng cao): Dùng Object kết hợp Date.now() giới hạn số lần gọi POST /api/links trong 1 phút; vượt ngưỡng trả về 429 Too Many Requests.
d) Lưu trữ dữ liệu:
   - Khởi tạo sẵn tối thiểu 05 bản ghi mẫu trong data/links.json.
   - Lưu nhật ký hoạt động tại logs/access.log và nhật ký bấm link tại logs/clicks.log.
ĐỀ 2: DỊCH VỤ CHIA SẺ GHI CHÚ / MÃ NGUỒN CÓ THỜI HẠN (MINI PASTEBIN / SECURE SNIPPET)
1. Vấn đề thực tế
Xây dựng máy chủ Backend tương tự Pastebin hoặc GitHub Gist thu nhỏ: cho phép người dùng tạo, chia sẻ, cập nhật và quản lý các đoạn văn bản hoặc mã nguồn (snippet). Hệ thống hỗ trợ phân biệt chế độ Công khai / Riêng tư, giới hạn số lượt xem tối đa (maxViews), thời hạn tự hủy (expiresAt) và cơ chế dọn dẹp tài nguyên hết hạn trên ổ cứng.

2. Yêu cầu đặt ra
a) Lưu trữ 2 tầng bằng node:fs/promises:
   - Tầng metadata: Lưu thông tin mô tả (id, title, author, isPrivate, views, maxViews, expiresAt, createdAt) trong data/snippets.json (khởi tạo sẵn tối thiểu 05 bản ghi mẫu).
   - Tầng nội dung: Lưu nội dung văn bản thực tế của từng snippet thành tệp riêng tại storage/<id>.txt (vận dụng đầy đủ mkdir, writeFile, readFile, unlink).
b) Định tuyến bằng express.Router() (02 module trong thư mục routes/):
   - snippetRoutes.js (gắn tại /api/snippets):
     + POST /: Tạo snippet mới (ghi nội dung ra storage/<id>.txt và lưu metadata vào data/snippets.json).
     + GET /: Trả về danh sách các snippet công khai còn hiệu lực.
     + GET /:id: Kiểm tra quyền truy cập nếu snippet là riêng tư; kiểm tra điều kiện hết hạn hoặc vượt quá maxViews (trả về 410 hoặc 400); tăng lượt xem (views); đọc nội dung từ storage/<id>.txt để trả về.
     + PUT /:id: Cập nhật tiêu đề, cấu hình hoặc nội dung snippet (chỉ tác giả hoặc admin).
     + DELETE /:id: Xóa metadata trong data/snippets.json và xóa tệp storage/<id>.txt bằng fs.unlink.
   - maintenanceRoutes.js (gắn tại /api/maintenance - chỉ dành cho Admin):
     + POST /cleanup: Quét toàn bộ snippet đã hết hạn hoặc vượt maxViews, xóa cả metadata lẫn tệp .txt tương ứng và ghi báo cáo vào logs/cleanup.log.
     + GET /stats: Thống kê tổng số snippet, số snippet đang hoạt động, công khai/riêng tư và số lượng đã hết hạn.
c) Chuỗi Middleware (thư mục middlewares/):
   - requestLogger: Đo thời gian xử lý từng request bằng res.on('finish') và ghi nối tiếp vào logs/access.log.
   - optionalAuth & requireAuth: Đọc header x-api-key đối chiếu danh sách tài khoản mẫu trong data/users.json để gắn thông tin vào req.currentUser. Xem snippet công khai không bắt buộc key; tạo, sửa, xóa hoặc xem snippet riêng tư phải xác thực (thiếu/sai trả về 401).
   - checkSnippetOwner & requireAdmin: Chỉ tác giả tạo snippet hoặc tài khoản role admin mới được sửa/xóa snippet; riêng /api/maintenance chỉ cho phép admin (không đủ quyền trả về 403).
   - validateSnippet: Kiểm tra tiêu đề và nội dung không được để trống, dung lượng văn bản không vượt quá 10KB (trả về 400 nếu không hợp lệ).
ĐỀ 3: ĐỀ TÀI TỰ ĐỀ XUẤT
1. Vấn đề thực tế
Sinh viên tự đề xuất một bài toán Backend có ứng dụng thực tế rõ ràng, giải quyết một nhu cầu quản lý hoặc vận hành cụ thể (không làm bài toán CRUD đơn lẻ thiếu xử lý nghiệp vụ).
Một số hướng gợi ý tham khảo:
- Quản lý đặt hàng & kiểm soát tồn kho cửa hàng.
- Đăng ký sự kiện, cấp mã vé & kiểm soát check-in.
- Tiếp nhận & xử lý phiếu yêu cầu hỗ trợ kỹ thuật (Helpdesk Ticket).
- Quản lý mượn/trả thiết bị hoặc phòng học theo khung giờ.
- Hệ thống thu thập nhật ký & cảnh báo sự cố máy chủ.
2. Yêu cầu đặt ra
a) Định tuyến (thư mục routes/):
   - Thiết kế >= 2 module Router độc lập bằng express.Router(), có liên kết xử lý dữ liệu qua lại giữa các tài nguyên.
   - Xây dựng >= 8 API endpoint, bao gồm đầy đủ các phương thức GET, POST, PUT, DELETE và tối thiểu 01 API thống kê hoặc sao lưu dữ liệu.
b) Chuỗi Middleware (thư mục middlewares/):
   - Tự xây dựng >= 3 Custom Middleware độc lập:
     + >= 1 Middleware ghi nhật ký truy cập kèm đo thời gian phản hồi (res.on('finish')) lưu ra tệp .log.
     + >= 1 Middleware xác thực qua header x-api-key (gắn thông tin người dùng vào đối tượng req, trả về 401 khi thiếu/sai key; khuyến khích bổ sung phân quyền vai trò trả về 403).
     + >= 1 Middleware kiểm tra tính hợp lệ của dữ liệu đầu vào (validate), trả về 400 khi dữ liệu sai hoặc thiếu trường bắt buộc.
   - Kích hoạt express.json() và morgan (khuyến khích bổ sung express.static() phục vụ trang giới thiệu API).
c) Lưu trữ & Xử lý tệp tin (data/, logs/, backups/):
   - Quản lý >= 2 tệp dữ liệu .json bằng node:fs/promises (khởi tạo tối thiểu 05 bản ghi mẫu cho tài nguyên chính).
   - Quản lý >= 1 tệp nhật ký .log sử dụng fs.appendFile.
   - Tách các hàm đọc/ghi tệp dùng chung ra module riêng (ví dụ: utils/fileHelper.js).
d) Ràng buộc nghiệp vụ thực tế:
   - Cài đặt >= 2 quy tắc xử lý nghiệp vụ cụ thể gắn liền với bài toán đã chọn (ví dụ: tự động trừ và hoàn lại số lượng tồn kho; chống đăng ký trùng lặp; kiểm tra giới hạn số lượng hoặc thời hạn; kiểm tra quyền sở hữu dữ liệu; hoặc kiểm soát quy trình chuyển trạng thái hợp lệ).
e) Tài liệu dự án (README.md):
   - Trình bày rõ bài toán thực tế đã chọn, các quy tắc nghiệp vụ đã cài đặt, cấu trúc tệp JSON, danh sách API và kịch bản kiểm thử trên Thunder Client.
