const chatStatusService = require('../services/chatstatusService');

exports.blockUser = async (req, res) => {
    try {
        const blockerId = req.user.id; // Lấy từ JWT middleware
        const { conversationId } = req.params;

        const result = await chatStatusService.blockUser(conversationId, blockerId);

        res.status(200).json({
            message: 'Đã chặn người dùng trong cuộc trò chuyện này',
            data: result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}