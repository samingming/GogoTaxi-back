import { Router } from 'express';
import { authRouter } from './modules/auth/routes';
import { requireAuth } from './middlewares/auth';
import { prisma } from './lib/prisma';

const router = Router();

// 상태 확인
router.get('/', (_req, res) => res.json({ message: 'GogoTaxi backend up' }));

// 인증 관련
router.use('/auth', authRouter);

// 보호 라우트 예시 (토큰 필요)
router.get('/me', requireAuth, (req, res) => {
  res.json({ me: req.user });
});

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

export { router };
