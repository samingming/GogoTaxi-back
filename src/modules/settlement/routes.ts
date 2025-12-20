import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth';
import { finalizeRoomSettlement, holdEstimatedFare } from './service';
import { loadRoomOrThrow, broadcastRoom } from '../../controllers/room.controller';
import { emitRoomsRefresh } from '../../lib/socket';
import { analyzeReceiptImage } from '../rideHistory/receiptService';
import { prisma } from '../../lib/prisma';

export const settlementRouter = Router();
settlementRouter.use(requireAuth);

settlementRouter.post('/rooms/:roomId/hold', async (req, res) => {
  try {
    const roomId = z.string().cuid().parse(req.params.roomId);
    const result = await holdEstimatedFare(roomId);
    res.status(201).json(result);
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: e.issues });
    if (e?.message === 'ROOM_NOT_FOUND') return res.status(404).json({ message: 'Room not found' });
    if (e?.message === 'ESTIMATED_FARE_MISSING') return res.status(409).json({ message: 'Estimated fare required' });
    if (e?.message === 'INSUFFICIENT_BALANCE') return res.status(402).json({ message: 'Insufficient balance' });
    console.error(e);
    res.status(500).json({ message: e?.message ?? 'Internal error' });
  }
});

settlementRouter.post('/rooms/:roomId/finalize', async (req, res) => {
  try {
    const roomId = z.string().cuid().parse(req.params.roomId);
    const body = z.object({ actualFare: z.number().int().positive() }).parse(req.body);
    const result = await finalizeRoomSettlement(roomId, body.actualFare);
    const room = await loadRoomOrThrow(roomId);
    broadcastRoom(room, (req as any).user?.sub);
    emitRoomsRefresh({ roomId, reason: 'settled' });
    res.status(201).json(result);
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: e.issues });
    if (e?.message === 'ROOM_NOT_FOUND') return res.status(404).json({ message: 'Room not found' });
    if (e?.message === 'ESTIMATED_FARE_MISSING') return res.status(409).json({ message: 'Estimated fare required' });
    console.error(e);
    res.status(500).json({ message: e?.message ?? 'Internal error' });
  }
});

settlementRouter.post('/rooms/:roomId/finalize/receipt', async (req, res) => {
  try {
    const roomId = z.string().cuid().parse(req.params.roomId);
    const input = z
      .object({
        imageBase64: z.string().min(20, 'imageBase64 is required'),
        mimeType: z.string().optional(),
        prompt: z.string().optional()
      })
      .parse(req.body);

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, creatorId: true }
    });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    const authUserId = (req as any)?.user?.sub;
    if (room.creatorId !== authUserId) {
      return res.status(403).json({ message: 'Only the host can manage settlement for this room' });
    }

    const analysis = await analyzeReceiptImage(input);
    const actualFare = normalizeReceiptAmount(analysis);
    const result = await finalizeRoomSettlement(roomId, actualFare);

    const updatedRoom = await loadRoomOrThrow(roomId);
    broadcastRoom(updatedRoom, authUserId);
    emitRoomsRefresh({ roomId, reason: 'settled' });

    return res.status(201).json({ analysis, settlement: result });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', issues: e.issues });
    }
    if (e?.message === 'ROOM_NOT_FOUND') {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (e?.message === 'ESTIMATED_FARE_MISSING') {
      return res.status(409).json({ message: 'Estimated fare required' });
    }
    if (e?.message === 'RECEIPT_TOTAL_MISSING') {
      return res.status(422).json({ message: 'Receipt does not contain a recognizable total amount' });
    }
    if (e?.message === 'RECEIPT_NOT_RECOGNIZED') {
      return res.status(422).json({ message: 'Unable to recognize a receipt in the uploaded image' });
    }
    if (e?.message === 'UNSUPPORTED_RECEIPT_CURRENCY') {
      return res.status(422).json({ message: '지원되지 않는 통화입니다. KRW 영수증만 처리할 수 있어요.' });
    }
    if (
      typeof e?.status === 'number' &&
      e.status >= 400 &&
      e.status < 500 &&
      typeof e?.message === 'string' &&
      e.message.includes('GEMINI_REQUEST_FAILED')
    ) {
      return res
        .status(400)
        .json({ message: e?.geminiMessage || 'Gemini에서 이미지를 처리하지 못했습니다. 다른 형식으로 시도해 주세요.' });
    }
    if (e?.message === 'GEMINI_API_KEY_NOT_CONFIGURED') {
      return res.status(500).json({ message: 'Gemini API key is not configured.' });
    }
    console.error(e);
    res.status(500).json({ message: e?.message ?? 'Internal error' });
  }
});

function normalizeReceiptAmount(analysis: Awaited<ReturnType<typeof analyzeReceiptImage>>): number {
  const amount =
    typeof analysis.totalAmount === 'number' && Number.isFinite(analysis.totalAmount)
      ? Math.round(Math.abs(analysis.totalAmount))
      : null;
  if (!amount || amount <= 0) {
    throw new Error('RECEIPT_TOTAL_MISSING');
  }
  const currency = analysis.currency?.trim().toUpperCase();
  if (currency && currency !== 'KRW') {
    throw new Error('UNSUPPORTED_RECEIPT_CURRENCY');
  }
  return amount;
}
