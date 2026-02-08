const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const friendController = require('../controllers/friendController');

router.post('/send', verifyToken, friendController.sendFriendRequest);

// Chấp nhận lời mời
router.put('/accept/:id', verifyToken, friendController.acceptFriendRequest);

// Chấp nhận lời mời kết bạn ở trang kết bạn thông tin
router.put('/acceptthongtin/:id', verifyToken, friendController.acceptFriendRequest1);
// Từ chối lời mời
router.put('/reject/:id', verifyToken, friendController.rejectFriendRequest);

// Xoá lời mời kết bạn
router.delete('/requests/:requestId', verifyToken, friendController.deleteFrendRequest);

// Get lời kết bạn
router.get('/pending', verifyToken, friendController.getPendingRequest);
router.get('/friends', verifyToken, friendController.getAcceptedRequest);
router.get('/blocked', verifyToken, friendController.getBlockedRequest);
router.get('/rejected', verifyToken, friendController.getRejectedRequest);
router.get('/receiverpending', verifyToken, friendController.getReceiverPendingRequest);

//getReceiverPending
router.get('/strangers', verifyToken, friendController.getStangers);

router.get('/accepted', verifyToken, friendController.getAccepteBirthdays);

module.exports = router;