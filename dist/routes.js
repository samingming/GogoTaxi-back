"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const routes_1 = require("./modules/auth/routes");
const auth_1 = require("./middlewares/auth");
const prisma_1 = require("./lib/prisma");
const router = (0, express_1.Router)();
exports.router = router;
// 상태 확인
router.get('/', (_req, res) => res.json({ message: 'GogoTaxi backend up' }));
// 인증 관련
router.use('/auth', routes_1.authRouter);
// 보호 라우트 예시 (토큰 필요)
router.get('/me', auth_1.requireAuth, (req, res) => {
    res.json({ me: req.user });
});
router.get('/notifications', auth_1.requireAuth, async (_req, res) => {
    try {
        const notifications = await prisma_1.prisma.notice.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return res.json({ notifications });
    }
    catch (error) {
        console.error('notifications error', error);
        return res.status(500).json({ message: 'Failed to load notifications' });
    }
});
