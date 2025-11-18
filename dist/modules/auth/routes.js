"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const dto_1 = require("./dto");
const service_1 = require("./service");
exports.authRouter = (0, express_1.Router)();
// 회원가입
exports.authRouter.post('/signup', async (req, res) => {
    try {
        const input = dto_1.SignUpDto.parse(req.body);
        const result = await (0, service_1.signUp)(input);
        res.status(201).json(result);
    }
    catch (e) {
        if (e?.message === 'EMAIL_TAKEN')
            return res.status(409).json({ message: 'Email already in use' });
        if (e?.name === 'ZodError')
            return res.status(400).json({ message: 'Validation failed', issues: e.issues });
        console.error(e);
        res.status(500).json({ message: 'Internal error' });
    }
});
// 로그인
exports.authRouter.post('/login', async (req, res) => {
    try {
        const input = dto_1.LoginDto.parse(req.body);
        const result = await (0, service_1.login)(input);
        res.json(result);
    }
    catch (e) {
        if (e?.message === 'INVALID_CREDENTIALS')
            return res.status(401).json({ message: 'Invalid email or password' });
        if (e?.name === 'ZodError')
            return res.status(400).json({ message: 'Validation failed', issues: e.issues });
        console.error(e);
        res.status(500).json({ message: 'Internal error' });
    }
});
