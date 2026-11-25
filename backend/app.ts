import express from 'express';
import morgan from 'morgan';

import router from './routes/index.routes.ts';

const app = express();

app.use(express.json());
app.use(morgan('dev'));

// TODO: gắn middlewares (requestLogger, apiKeyAuth, ...) và routers theo đúng thứ tự pipeline

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(router);

export default app;
