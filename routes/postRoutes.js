const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Đăng bài (ảnh hoặc video)
router.post('/posts', verifyToken, upload.single('file'), postController.createPost);
router.post('/postsfb', verifyToken, upload.single("file"), postController.createPostFb);

// Thích bài post
router.post('/posts/react', verifyToken, postController.reactPost);

router.get('/post/feed', verifyToken, postController.getUserFeeds);

router.get('/post/postfbuser', verifyToken, postController.getUserPosts);

router.post('/post/view/:postId', verifyToken, postController.viewPost);

router.get('/post/reactions', verifyToken, postController.getAllReactions);
// getUserPosts12
router.get('/post1/postfbuser', verifyToken, postController.getUserPosts12);
module.exports = router;