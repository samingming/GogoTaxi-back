"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSession = createPaymentSession;
exports.listPaymentSessions = listPaymentSessions;
exports.processPaymentEvent = processPaymentEvent;
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const service_1 = require("../wallet/service");
const service_2 = require("../notifications/service");
const sessions = new Map();
function createPaymentSession(input) {
    const session = {
        id: (0, crypto_1.randomUUID)(),
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
function listPaymentSessions(userId) {
    const values = Array.from(sessions.values());
    if (!userId)
        return values;
    return values.filter((session) => session.userId === userId);
}
async function processPaymentEvent(sessionId, event) {
    const session = sessions.get(sessionId);
    if (!session)
        throw new Error('SESSION_NOT_FOUND');
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
async function handleSessionSuccess(session) {
    switch (session.purpose) {
        case 'wallet_topup':
            await (0, service_1.recordTransaction)({
                userId: session.userId,
                roomId: session.roomId,
                kind: client_1.WalletTxKind.top_up,
                amount: session.amount,
                idempotencyKey: `payment_session:${session.id}`,
                metadata: session.metadata
            });
            (0, service_2.sendNotification)({
                userId: session.userId,
                title: '지갑 충전 완료',
                body: `${session.amount.toLocaleString()}원이 지급되었습니다.`,
                metadata: { sessionId: session.id }
            });
            break;
        case 'room_charge':
            (0, service_2.sendNotification)({
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
