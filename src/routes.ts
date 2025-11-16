import { Router } from 'express';
import { authRouter } from './modules/auth/routes';
import { requireAuth } from './middlewares/auth';

export const router = Router();

router.get('/', (_req, res) => res.json({ message: 'GogoTaxi backend up' }));

router.use('/auth', authRouter);

router.get('/me', requireAuth, (req, res) => {
  res.json({ me: req.user });
});
