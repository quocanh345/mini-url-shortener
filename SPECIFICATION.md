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
