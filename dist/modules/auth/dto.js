"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginDto = exports.SignUpDto = void 0;
const zod_1 = require("zod");
exports.SignUpDto = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(64),
    nickname: zod_1.z.string().min(1).max(30)
});
exports.LoginDto = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(64)
});
