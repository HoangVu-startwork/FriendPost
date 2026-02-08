const messageService = require('../services/messageService');


exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        // thường được gắn vào request sau khi xác thực JWT hoặc session thành công.
        // Có nghĩa là người gửi đã đăng nhập rồi.
        const { receiverId, content, replyToId } = req.body;
        const message = await messageService.sendMessage(senderId, receiverId, content, replyToId);
        res.json({ message: 'Gửi tin nhắn thành công', data: message });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.sendMessageImg = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, content, contentType, replyToId } = req.body;
        const filePath = req.file ? req.file.path : null; // Lấy đường dẫn ảnh upload tạm

        const result = await messageService.sendMessageimage(
            senderId,
            receiverId,
            content,
            contentType,
            filePath,
            replyToId
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