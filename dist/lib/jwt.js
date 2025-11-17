"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJwt = signJwt;
exports.verifyJwt = verifyJwt;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = (process.env.JWT_SECRET ?? 'dev');
const RAW = process.env.JWT_EXPIRES_IN ?? '7d';
const EXPIRES_IN = /^\d+$/.test(RAW) ? Number(RAW) : RAW ?? '7d';
function signJwt(payload) {
    const opts = { expiresIn: EXPIRES_IN };
    return jsonwebtoken_1.default.sign(payload, SECRET, opts);
}
function verifyJwt(token) {
    return jsonwebtoken_1.default.verify(token, SECRET);
}
