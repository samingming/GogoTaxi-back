import { randomUUID } from 'crypto';

export type NotificationMessage = {
  id: string;
  userId: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  read?: boolean;
};

const inbox = new Map<string, NotificationMessage[]>();

export function sendNotification(input: {
  userId: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  const msg: NotificationMessage = {
    id: randomUUID(),
    userId: input.userId,
    title: input.title,
    body: input.body,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
    read: false
  };
  const list = inbox.get(input.userId) ?? [];
  list.push(msg);
  inbox.set(input.userId, list);
  console.log(`[notification] -> ${input.userId}: ${input.title} - ${input.body}`);
  return msg;
}

export function listNotifications(userId: string) {
  return inbox.get(userId) ?? [];
}
