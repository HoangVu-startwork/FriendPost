const messageService = require('../services/messageService');




exports.sendMessageImg = async (req, res) => {
    try {
        console.log("id + " + req.user.id)
        const senderId = req.user.id;
        const { receiverId, content, contentType, replyToId, conversationId } = req.body;
        const filePath = req.file ? req.file.path : null; // Lấy đường dẫn ảnh upload tạm
        const originalName = req.file ? req.file.originalname : null;
        console.log(filePath)
        const result = await messageService.sendMessageimage(
            senderId,
            receiverId,
            content,
            contentType,
            filePath,
            originalName,
            replyToId,
            conversationId,
            req.io
        )

        res.json({
            success: true,
            message: 'Gửi tin nhắn thành công',
            data: result.message,
            notice: result.notice
        });
    } catch (error) {
        console.error('❌ Lỗi gửi tin nhắn:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Gửi tin nhắn thất bại'
        });
    }
}

exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        const messages = await messageService.getConversationMessages(userId, conversationId);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getMessagesblock = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        const messages = await messageService.getConversationMessagesblock(userId, conversationId);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

exports.markAsReadUpTo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId, lastMessageId } = req.body;

        if (!conversationId || !lastMessageId) {
            return res.status(400).json({
                message: "Thiếu conversationId hoặc lastMessageId"
            });
        }

        const updatedCount = await messageService.markAsReadUpTo(
            userId,
            conversationId,
            lastMessageId
        );

        console.log(updatedCount)
        const now = new Date();

        // 🔥 Emit socket nếu có tin được cập nhật
        if (updatedCount > 0) {
            req.io.to(`conversation_${conversationId}`).emit("messagesRead", {
                conversationId,
                readerId: userId,
                lastMessageId,
                isRead: true,
                updatedAt: now
            });
        }

        return res.json({
            success: true,
            updatedCount
        });

    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
};