const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const messageController = require('../controllers/messageController');
const upload = require('../middlewares/upload');

router.post('/send', verifyToken, messageController.sendMessage);


router.get('/:conversationId', verifyToken, messageController.getMessages);
router.get('/getblock/:conversationId', verifyToken, messageController.getMessagesblock);

// Gửi tin nhắn text hoặc ảnh
router.post('/sendimg', upload.single('file'), messageController.sendMessageImg);

module.exports = router;