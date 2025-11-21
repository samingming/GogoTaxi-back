import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth';
import { listNotifications, sendNotification } from './service';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', (req, res) => {
  const notes = listNotifications(req.user!.sub);
  res.json({ notifications: notes });
});

notificationsRouter.post('/test', (req, res) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(120).optional(),
        body: z.string().min(1).max(500).optional()
      })
      .parse(req.body ?? {});
    const notification = sendNotification({
      userId: req.user!.sub,
      title: body.title ?? '테스트 알림',
      body: body.body ?? '테스트 본문 입니다.',
      metadata: { test: true }
    });
    res.status(201).json({ notification });
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: e.issues });
    console.error(e);
    res.status(500).json({ message: 'Internal error' });
  }
});
