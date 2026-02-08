const express = require('express');
const router = express.Router();
const userintroduceController = require('../controllers/userintroduceController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Thêm thông tin trường học
router.post('/education', verifyToken, userintroduceController.createEducations);
// truy vấn thông tin của user gồm có tất cả post, trường, thông tin cá nhân, thong tin email, sdt ....
router.get('/educations/:userId', verifyToken, userintroduceController.getEducation);
// Thêm thông tin cá nhân, địa chỉ
router.post('/introduce', verifyToken , userintroduceController.createUserInforations);
// truy vấn thông tin dựa của user khác nhìn vào
router.get('/introduces/:userId', verifyToken, userintroduceController.getUserInforation);
// Thêm mối quan hệ giữa các user
router.post('/relationship', verifyToken, userintroduceController.createRelationship);
// Xác nhận mối quan hệ giữa các user
router.put('/relationships/:relationshipId', verifyToken, userintroduceController.confirmRelationships);
// Thêm công việc
router.post('/job', verifyToken, userintroduceController.createUserJobs);
// truy vấn dữ liệu công việc
router.get('/josbs/:userId', verifyToken, userintroduceController.getUsersJob);


module.exports = router;