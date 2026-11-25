import express from 'express';
import morgan from 'morgan';
import { apiKeyAuth } from './middlewares/apiKeyAuth.ts';
import { errorHandler, notFound } from './middlewares/errorHandler.ts';
import { requestLogger } from './middlewares/requestLogger.ts';
import analyticsRouter from './routes/analyticsRoutes.ts';
import linkRouter from './routes/linkRoutes.ts';
import redirectRouter from './routes/redirectRoutes.ts';

const app = express();

// Pipeline xử lý request (thứ tự quan trọng):
// 1. Ghi log mọi request vào logs/access.log (đặt đầu tiên để đo được toàn bộ thời gian xử lý)
app.use(requestLogger);
// 2. Log ra console và parse body JSON
app.use(morgan('dev', { skip: () => process.env.NODE_ENV === 'test' }));
app.use(express.json());

// 3. Route công khai: chuyển hướng link ngắn (không cần API key)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
app.use('/s', redirectRouter);

// 4. Nhóm /api: bắt buộc header x-api-key
//    (rateLimiter và validateUrl được gắn riêng cho từng route trong linkRoutes)
app.use('/api', apiKeyAuth);
app.use('/api/links', linkRouter);
app.use('/api/analytics', analyticsRouter);

// 5. Không khớp route nào → 404, mọi lỗi → errorHandler (luôn đặt cuối cùng)
app.use(notFound);
app.use(errorHandler);

export default app;
