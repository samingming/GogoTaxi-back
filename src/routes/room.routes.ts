import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import * as roomController from '../controllers/room.controller';

const router = Router();

// 방 생성
router.post('/rooms', requireAuth, roomController.createRoom);

// 방 검색
router.get('/rooms', requireAuth, roomController.listRooms);
router.get('/rooms/match', requireAuth, roomController.matchRooms);
router.get('/rooms/mine', requireAuth, roomController.listMyRooms);

// 방 상세
router.get('/rooms/:id', requireAuth, roomController.getRoomDetail);

// 방 수정 (방장만)
router.patch('/rooms/:id', requireAuth, roomController.updateRoom);

// 방 닫기 (방장만)

// 방 참여 / 나가기
router.post('/rooms/:id/join', requireAuth, roomController.joinRoom);
router.post('/rooms/:id/leave', requireAuth, roomController.leaveRoom);

router.post('/rooms/join', requireAuth, (req, res) => {
  const roomId = req.body?.roomId;
  if (!roomId || typeof roomId !== 'string') {
    return res.status(400).json({ message: 'roomId is required' });
  }
  req.params = { id: roomId };
  return roomController.joinRoom(req, res);
});

router.post('/rooms/leave', requireAuth, (req, res) => {
  const roomId = req.body?.roomId;
  if (!roomId || typeof roomId !== 'string') {
    return res.status(400).json({ message: 'roomId is required' });
  }
  req.params = { id: roomId };
  return roomController.leaveRoom(req, res);
});

export default router;
