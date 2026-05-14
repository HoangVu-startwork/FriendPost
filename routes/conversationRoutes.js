const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const conversationController = require('../controllers/conversationController');
// get truy cập hiện thị sắp xếp hiện tin nhắn riêng và group
router.get('/conversation', verifyToken, conversationController.getMyConversations);
// Tạo tin nhắn group
router.post('/conversations/group', verifyToken, conversationController.createGroup);
// Thay đổi tên group
router.put('/conversations/group/:conversationId', verifyToken, conversationController.updateName);

router.post('/conversations/user/group/:conversationId', verifyToken, conversationController.addUserParticipants);
module.exports = router;