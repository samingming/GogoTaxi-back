import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { ENV } from './config/env';
import { router } from './routes';

const logger = pino({ transport: { target: 'pino-pretty' } });
const app = express();

const PORT = Number(ENV.PORT) || 8080;

app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:5173",             // 개발용
      "https://ansangah.github.io",        // 깃허브 Pages 도메인
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, env: ENV.NODE_ENV, time: new Date().toISOString() });
});

app.use('/api', router);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on ${PORT}`);
});

// app.ts 또는 index.ts 맨 아래
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('❌ ERR:', {
    message: err?.message,
    code: err?.code,
    meta: err?.meta,
    stack: err?.stack,
  });
  res.status(err.status || 500).json({
    message: 'Internal error',
    code: err?.code,
    meta: err?.meta,
  });
});
