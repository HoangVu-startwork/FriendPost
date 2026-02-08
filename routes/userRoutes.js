const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const verifyTokenAdmin = require('../middlewares/authorizeRole')
const upload = require('../middlewares/upload');

router.post('/register', userController.register);
router.post('/register_admin', userController.registerAdmin);
router.post('/login', userController.login);
router.get('/verify', verifyToken, userController.getUserInfo);

// thêm user mảng registersUsers
router.post('/registersmang', userController.registersMangUsers);


router.put('/avatar/:id', upload.single('avatar'), userController.updateAvatar);
// Chỉ cho phép các quyền khác "khachhang" truy cập
router.get('/statistics', verifyToken, verifyTokenAdmin(['admin', 'admin_user']), userController.getUserStatistics);
module.exports = router;