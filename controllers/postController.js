const postService = require('../services/postService');

exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const file = req.file;

    const post = await postService.createPost(content, file);

    res.status(201).json({
      message: '✅ Đăng bài thành công!',
      post,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPostFb1 = async (req, res) => {
  try {
    const { content, backgroundColor } = req.body;
    const file = req.file;

    const userId = req.user.id;  // ⭐ lấy từ token

    const post = await postService.createPostFb(content, file, userId, backgroundColor);

    res.status(201).json({ message: "Đăng bài thành công!", post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sử dụng cái này
exports.createPostFb = async (req, res) => {
  try {
    const { content, backgroundColor, privacy, userList } = req.body;
    const file = req.file;
    const userId = req.user.id;
    const post = await postService.createPostFb(
      content, file, userId, backgroundColor, privacy, userList
    );

    res.status(201).json({ message: "Đăng bài thành công!", post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.reactPost = async (req, res) => {
  try {
    const { postId, reactionCode } = req.body;

    // userId lấy từ middleware auth
    const userId = req.user.id;

    const result = await postService.reactPostcode({
      postId,
      userId,
      reactionCode
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

exports.getUserFeeds = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const posts = await postService.getSmartFeeds(currentUserId);

    res.json({
      success: true,
      const: posts.length,
      data: posts
    });

  } catch (error) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}


exports.getUserPosts = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const posts = await postService.getSmartFeed(currentUserId);

    res.json({
      success: true,
      const: posts.length,
      data: posts
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}


//
exports.getUserPosts12 = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // 📌 lấy từ query, nếu không có thì dùng mặc định
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const seed = req.query.seed;
    const posts = await postService.getSmartFeed12(currentUserId, page, limit, seed);

    res.json({
      success: true,
      const: posts.length,
      data: posts
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}
//

exports.viewPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    await postService.addPostView(postId, userId);

    res.status(200).json({ message: "View counted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// Get thông tin getAllReaction

exports.getAllReactions = async (req, res) => {
  try {
    const reaction = await postService.getAllReaction();
    return res.status(200).json({
      success: true,
      data: reaction
    });
  } catch (err) {
    console.err('Error getAllReactions:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
}