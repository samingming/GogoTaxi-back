import { randomUUID } from 'crypto';
import { WalletTxKind } from '@prisma/client';
import { recordTransaction } from '../wallet/service';
import { sendNotification } from '../notifications/service';

export type PaymentPurpose = 'wallet_topup' | 'room_charge';

export type PaymentSession = {
  id: string;
  userId: string;
  roomId?: string;
  amount: number;
  currency: string;
  purpose: PaymentPurpose;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};

const sessions = new Map<string, PaymentSession>();

export function createPaymentSession(input: {
  userId: string;
  amount: number;
  currency?: string;
  purpose: PaymentPurpose;
  roomId?: string;
  metadata?: Record<string, unknown>;
}) {
  const session: PaymentSession = {
    id: randomUUID(),
    userId: input.userId,
    roomId: input.roomId,
    amount: input.amount,
    currency: input.currency ?? 'KRW',
    purpose: input.purpose,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: input.metadata
  };
  sessions.set(session.id, session);
  return session;
}

export function listPaymentSessions(userId?: string) {
  const values = Array.from(sessions.values());
  if (!userId) return values;
  return values.filter((session) => session.userId === userId);
}

export async function processPaymentEvent(sessionId: string, event: 'payment.succeeded' | 'payment.failed') {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('SESSION_NOT_FOUND');
  if (session.status !== 'pending') {
    return session;
  }
  const status = event === 'payment.succeeded' ? 'succeeded' : 'failed';
  session.status = status;
  session.updatedAt = new Date().toISOString();
  sessions.set(session.id, session);

  if (status === 'succeeded') {
    await handleSessionSuccess(session);
  }
  return session;
}

async function handleSessionSuccess(session: PaymentSession) {
  switch (session.purpose) {
    case 'wallet_topup':
      await recordTransaction({
        userId: session.userId,
        roomId: session.roomId,
        kind: WalletTxKind.top_up,
        amount: session.amount,
        idempotencyKey: `payment_session:${session.id}`,
        metadata: session.metadata as any
      });
      sendNotification({
        userId: session.userId,
        title: '지갑 충전 완료',
        body: `${session.amount.toLocaleString()}원이 지급되었습니다.`,
        metadata: { sessionId: session.id }
      });
      break;
    case 'room_charge':
      sendNotification({
        userId: session.userId,
        title: '방 결제 완료',
        body: `방 ${session.roomId ?? ''}에 대한 결제가 완료되었습니다.`,
        metadata: { sessionId: session.id }
      });
      break;
    default:
      break;
  }
}
