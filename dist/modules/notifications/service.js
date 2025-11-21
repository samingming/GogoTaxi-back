"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.listNotifications = listNotifications;
const crypto_1 = require("crypto");
const inbox = new Map();
function sendNotification(input) {
    const msg = {
        id: (0, crypto_1.randomUUID)(),
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
function listNotifications(userId) {
    return inbox.get(userId) ?? [];
}
