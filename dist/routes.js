"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const routes_1 = require("./modules/auth/routes");
const auth_1 = require("./middlewares/auth");
exports.router = (0, express_1.Router)();
// 상태 확인
exports.router.get('/', (_req, res) => res.json({ message: 'GogoTaxi backend up' }));
// 인증 관련
exports.router.use('/auth', routes_1.authRouter);
// 보호 라우트 예시 (토큰 필요)
exports.router.get('/me', auth_1.requireAuth, (req, res) => {
    res.json({ me: req.user });
});
module.exports = { router: exports.router };
