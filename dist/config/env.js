"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
require("dotenv/config");
exports.ENV = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: Number(process.env.PORT ?? 8080),
    DATABASE_URL: process.env.DATABASE_URL ?? ''
};
if (!exports.ENV.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL is empty. Set it in .env');
}
