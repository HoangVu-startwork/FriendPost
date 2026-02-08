const { Comment, User } = require('../models');
const { uploadToCloudinary } = require('./cloudinaryService');

exports.createComment = async (postId, userId, content, parentId = null, imageUrl = null) => {
    const comment = await Comment.create({
        postId,
        userId,
        content,
        parentId,
        imageUrl
    });

    return comment;
};


// Lấy tất cả bình luận của 1 bài viết (bao gồm replies)
exports.createComment = async (postId, userId, content, parentId, file ) => {
    let uploadResult = null;

    if (file) {
        uploadResult = await uploadToCloudinary(file.path, 'comments');
    }

    const comment = await Comment.create({
        postId,
        userId,
        content,
        parentId: parentId || null,
        mediaUrl: uploadResult ? uploadResult.url : null,
        mediaType: uploadResult ? uploadResult.type : null,
    });

    return comment;
}

exports.getCommentsByPost = async (postId) => {
    const comments = await Comment.findAll({
        where : { postId, parentId: null },
        include : [
            {
                model: Comment,
                as: 'replies',
            },
        ],
        order: [['createdAt', 'ASC']],
    });

    return comments;
}