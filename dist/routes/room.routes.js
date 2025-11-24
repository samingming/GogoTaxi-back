"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const roomController = __importStar(require("../controllers/room.controller"));
const router = (0, express_1.Router)();
// 방 생성
router.post('/rooms', auth_1.requireAuth, roomController.createRoom);
// 방 검색
router.get('/rooms', auth_1.requireAuth, roomController.listRooms);
router.get('/rooms/match', auth_1.requireAuth, roomController.matchRooms);
// 방 상세
router.get('/rooms/:id', auth_1.requireAuth, roomController.getRoomDetail);
// 방 수정 (방장만)
router.patch('/rooms/:id', auth_1.requireAuth, roomController.updateRoom);
// 방 닫기 (방장만)
router.post('/rooms/:id/close', auth_1.requireAuth, roomController.closeRoom);
// 방 참여 / 나가기
router.post('/rooms/:id/join', auth_1.requireAuth, roomController.joinRoom);
router.post('/rooms/:id/leave', auth_1.requireAuth, roomController.leaveRoom);
exports.default = router;
