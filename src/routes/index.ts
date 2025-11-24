import { Router } from 'express';
import { authRouter } from '../modules/auth/routes';
import { requireAuth } from '../middlewares/auth';
import { prisma } from '../lib/prisma';
import roomRouter from './room.routes';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

router.use('/auth', authRouter);
router.use(roomRouter);

router.get('/notifications', requireAuth, async (_req, res) => {
  try {
    const notifications = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return res.json({ notifications });
  } catch (error) {
    console.error('notifications error', error);
    return res.status(500).json({ message: 'Failed to load notifications' });
  }
});
