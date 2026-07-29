import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { createServer } from 'http';
import { ENV } from './config/env';
// Use the routes/index.ts (folder) router which includes ride-related endpoints.
// Explicitly import the router defined in src/routes/index.ts (not the legacy src/routes.ts)
import { router } from './routes/index';
import { requestLimiter } from './middlewares/security';
import { errorHandler, notFoundHandler } from './middlewares/error';
import { initSocket } from './lib/socket';
import { isAllowedOrigin } from './config/cors';

const logger = pino({ transport: { target: 'pino-pretty' } });
const app = express();

const PORT = Number(ENV.PORT) || 8080;

app.set('etag', false);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] ?? 'Content-Type, Authorization');
    res.status(204).end();
    return;
  }
  next();
});

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  })
);
app.use(
  express.raw({
    type: (req) => {
      const ct = req.headers['content-type'] || '';
      if (typeof ct === 'string' && ct.toLowerCase().startsWith('multipart/form-data')) {
        return false;
      }
      return true;
    },
    limit: '5mb'
  })
);

app.use((req, _res, next) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    req.body = {};
    return next();
  }
  const rawText = req.body.toString('utf-8').trim();
  if (!rawText) {
    req.body = {};
    return next();
  }

  const jsonStart = rawText.indexOf('{');
  if (jsonStart !== -1) {
    const candidate = rawText.slice(jsonStart);
    try {
      req.body = JSON.parse(candidate);
      return next();
    } catch (error) {
      // fall through
    }
  }

  if (!rawText.includes('\n') && rawText.includes('=')) {
    req.body = Object.fromEntries(new URLSearchParams(rawText));
    return next();
  }

  req.body = { raw: rawText };
  next();
});
app.use(pinoHttp({ logger }));
app.use(requestLimiter);

app.get('/health', (_req, res) => {
  res.json({ ok: true, env: ENV.NODE_ENV, time: new Date().toISOString() });
});

app.use('/api', router);

app.use(notFoundHandler);
app.use(errorHandler);

const server = createServer(app);
initSocket(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on ${PORT}`);
});
