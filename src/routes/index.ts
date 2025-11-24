import { Router } from 'express';
import { authRouter } from '../modules/auth/routes';
import roomRouter from './room.routes';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

router.use('/auth', authRouter);
router.use(roomRouter);
