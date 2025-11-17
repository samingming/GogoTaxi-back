"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jwt_1 = require("../lib/jwt");
function requireAuth(req, res, next) {
    const header = req.headers.authorization; // "Bearer <token>"
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: missing Bearer token' });
    }
    const token = header.slice('Bearer '.length);
    try {
        const payload = (0, jwt_1.verifyJwt)(token);
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ message: 'Unauthorized: invalid token' });
    }
}
