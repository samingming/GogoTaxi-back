"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const routes_1 = require("../modules/auth/routes");
const room_routes_1 = __importDefault(require("./room.routes"));
exports.router = (0, express_1.Router)();
exports.router.get('/health', (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
});
exports.router.use('/auth', routes_1.authRouter);
exports.router.use(room_routes_1.default);
