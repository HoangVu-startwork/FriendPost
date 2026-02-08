const ChatStatus = require('../models/ChatStatus');
const { Sequelize, Op } = require('sequelize');


exports.blockUser = async (conversationId, blockerId) => {
    // Tìm chat status theo conversationId
    const chatStatus = await ChatStatus.findOne({ where: { conversationId } });

    if (!chatStatus) {
        throw new Error('Không tìm thấy cuộc trò chuyện');
    }

    // Kiểm tra xem người chặn có thuộc cuộc trò chuyện không
    if (![chatStatus.userOneId, chatStatus.userTwoId].includes(blockerId)) {
        throw new Error('Bạn không có quyền chặn trong cuộc trò chuyện này');
    }

    // Cập nhật trạng thái
    chatStatus.status = 'blocked';
    chatStatus.blockedBy = blockerId;
    chatStatus.blockedAt = new Date();

    await chatStatus.save();
    return chatStatus;
}