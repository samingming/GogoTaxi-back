import { Router } from 'express';
import { authRouter } from './modules/auth/routes';
import { requireAuth } from './middlewares/auth';
import { getProfile, updateProfile } from './modules/auth/service';
import { UpdateProfileDto } from './modules/auth/dto';

export const router = Router();

// 상태 확인
router.get('/', (_req, res) => res.json({ message: 'GogoTaxi backend up' }));

// 인증 관련
router.use('/auth', authRouter);

// 보호 API
router.get('/me', requireAuth, async (req, res) => {
  try {
    const me = await getProfile(req.userId!);
    res.json({ me });
  } catch (e: any) {
    if (e?.message === 'USER_NOT_FOUND') return res.status(404).json({ message: 'User not found' });
    console.error(e);
    res.status(500).json({ message: 'Internal error' });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const input = UpdateProfileDto.parse(req.body);
    const me = await updateProfile(req.userId!, input);
    res.json({ me });
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: e.issues });
    if (e?.message === 'USER_NOT_FOUND') return res.status(404).json({ message: 'User not found' });
    console.error(e);
    res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = { router };
