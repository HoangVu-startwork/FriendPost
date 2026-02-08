const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const chatStatusRoutes = require('../controllers/chatStatusController');

router.put('/:conversationId/block', verifyToken, chatStatusRoutes.blockUser);


module.exports = router;