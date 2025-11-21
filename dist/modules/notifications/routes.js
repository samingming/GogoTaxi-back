"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middlewares/auth");
const service_1 = require("./service");
exports.notificationsRouter = (0, express_1.Router)();
exports.notificationsRouter.use(auth_1.requireAuth);
exports.notificationsRouter.get('/', (req, res) => {
    const notes = (0, service_1.listNotifications)(req.user.sub);
    res.json({ notifications: notes });
});
exports.notificationsRouter.post('/test', (req, res) => {
    try {
        const body = zod_1.z
            .object({
            title: zod_1.z.string().min(1).max(120).optional(),
            body: zod_1.z.string().min(1).max(500).optional()
        })
            .parse(req.body ?? {});
        const notification = (0, service_1.sendNotification)({
            userId: req.user.sub,
            title: body.title ?? '테스트 알림',
            body: body.body ?? '테스트 본문 입니다.',
            metadata: { test: true }
        });
        res.status(201).json({ notification });
    }
    catch (e) {
        if (e?.name === 'ZodError')
            return res.status(400).json({ message: 'Validation failed', issues: e.issues });
        console.error(e);
        res.status(500).json({ message: 'Internal error' });
    }
});
