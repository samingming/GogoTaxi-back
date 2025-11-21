import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth';
import { listMockPayments, mockCharge, mockRefund } from './mockClient';
import { createPaymentSession, listPaymentSessions, processPaymentEvent } from './service';

const MOCK_WEBHOOK_SECRET = process.env.PAYMENTS_MOCK_WEBHOOK_SECRET ?? 'mock-secret';

export const paymentsRouter = Router();

paymentsRouter.post('/mock/webhook', async (req, res) => {
  try {
    const body = z
      .object({
        sessionId: z.string().uuid(),
        event: z.enum(['payment.succeeded', 'payment.failed']),
        secret: z.string().min(3)
      })
      .parse(req.body);
    if (body.secret !== MOCK_WEBHOOK_SECRET) {
      return res.status(401).json({ message: 'Invalid secret' });
    }
    const session = await processPaymentEvent(body.sessionId, body.event);
    res.json({ session });
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: e.issues });
    if (e?.message === 'SESSION_NOT_FOUND') return res.status(404).json({ message: 'Session not found' });
    console.error(e);
    res.status(500).json({ message: 'Internal error' });
  }
});

paymentsRouter.use(requireAuth);

paymentsRouter.get('/mock', (_req, res) => {
  res.json({ payments: listMockPayments() });
});

paymentsRouter.get('/mock/sessions', (req, res) => {
  const sessions = listPaymentSessions(req.user?.sub);
  res.json({ sessions });
});

paymentsRouter.post('/mock/session', async (req, res) => {
  try {
    const body = z
      .object({
        amount: z.number().int().positive(),
        currency: z.string().default('KRW'),
        purpose: z.enum(['wallet_topup', 'room_charge']),
        roomId: z.string().cuid().optional(),
        metadata: z.record(z.string(), z.any()).optional()
      })
      .parse(req.body);
    const session = createPaymentSession({
      userId: req.user!.sub,
      amount: body.amount,
      currency: body.currency,
      purpose: body.purpose,
      roomId: body.roomId,
      metadata: body.metadata
    });
    res.status(201).json({
      session,
      paymentUrl: `https://mock.payments.local/session/${session.id}`
    });
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: e.issues });
    console.error(e);
    res.status(500).json({ message: 'Internal error' });
  }
});

paymentsRouter.post('/mock/session/:sessionId/confirm', async (req, res) => {
  try {
    const params = z.object({ sessionId: z.string().uuid() }).parse(req.params);
    const session = await processPaymentEvent(params.sessionId, 'payment.succeeded');
    res.json({ session });
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: e.issues });
    if (e?.message === 'SESSION_NOT_FOUND') return res.status(404).json({ message: 'Session not found' });
    console.error(e);
    res.status(500).json({ message: 'Internal error' });
  }
});

paymentsRouter.post('/mock/session/:sessionId/fail', async (req, res) => {
  try {
    const params = z.object({ sessionId: z.string().uuid() }).parse(req.params);
    const session = await processPaymentEvent(params.sessionId, 'payment.failed');
    res.json({ session });
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: e.issues });
    if (e?.message === 'SESSION_NOT_FOUND') return res.status(404).json({ message: 'Session not found' });
    console.error(e);
    res.status(500).json({ message: 'Internal error' });
  }
});

paymentsRouter.post('/mock/charge', (req, res) => {
  try {
    const body = z
      .object({
        amount: z.number().int().positive(),
        currency: z.string().default('KRW'),
        metadata: z.record(z.string(), z.any()).optional()
      })
      .parse(req.body);
    const payment = mockCharge(body);
    res.status(201).json({ payment });
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: e.issues });
    console.error(e);
    res.status(500).json({ message: 'Internal error' });
  }
});

paymentsRouter.post('/mock/refund', (req, res) => {
  try {
    const body = z
      .object({
        paymentId: z.string().uuid(),
        amount: z.number().int().positive(),
        currency: z.string().default('KRW'),
        metadata: z.record(z.string(), z.any()).optional()
      })
      .parse(req.body);
    const payment = mockRefund(body);
    res.status(201).json({ payment });
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: e.issues });
    console.error(e);
    res.status(500).json({ message: 'Internal error' });
  }
});
