"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const routes_1 = require("./modules/auth/routes");
const auth_1 = require("./middlewares/auth");
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
