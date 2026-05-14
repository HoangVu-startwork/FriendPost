const { FriendRequest } = require('../models');
const friendService = require('../services/friendService');


exports.sendFriendRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { sdt, message } = req.body;

        if (!sdt) {
            return res.sttus(400).json({ message: 'Vui lòng nhập số điện thoại người nhận' });
        }

        const request = await friendService.sendFriendRequest_ketban(
            senderId,
            sdt,
            message
        );

        // 🔥 REALTIME — Gửi thông báo cho User2 (receiver)
        const receiverId = String(request.friendRequest.receiverId);

        const friendRequestId = request.friendRequest.id;

        // 🚀 Gửi thông báo đến ROOM của userId (KHÔNG cần socketId)
        req.io.to(receiverId).emit("newFriendRequest", {
            friendRequestId,
            fromUserId: senderId,
            fromPhone: request.sender.sdt,
            fromUsername: request.sender.username,
            fromEmail: request.sender.email,
            fromAvatar: request.sender.avatarUrl,
            message: message || ""
        });
        
        console.log(friendRequestId)

        res.status(201).json({
            message: 'Gửi lời mời kết bạn thành công',
            friendRequestId: request.friendRequest.id,
            FriendRequest: request
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// Chấp nhận lời mời
        // params là viết tắt của “parameters” (tham số) trong ExpressJS, nó nằm trong đối tượng req (request) — tức là dữ liệu của yêu cầu gửi từ client lên server.
        // req.params chứa các giá trị tham số động (dynamic parameters) được định nghĩa trong đường dẫn (URL) của API.

exports.acceptFriendRequest = async (req, res) => {
    try {
        const receiverId = req.user.id;
        const { id } = req.params;

        const updated = await friendService.acceptFriendRequest(receiverId, id, req.io);
        res.status(200).json({ message: 'Đã chấp nhận lời mời kết bạn', friendRequest: updated });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
exports.acceptFriendRequest1 = async (req, res) => {
    try {
        const receiverId = req.user.id;
        const { id } = req.params;
        const updated = await friendService.acceptFriendRequest1(receiverId, id);
        res.status(200).json({ message: 'Đã chấp nhận lời mời kết bạn', friendRequest: updated });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
// Từ chối lời mời
exports.rejectFriendRequest = async (req, res) => {
    try {
        const receiverId = req.user.id;
        const { id } = req.params;

        const updated = await friendService.rejectFriendRequest(receiverId, id);
        res.status(200).json({ message: 'Đã từ chối lời mời kết bạn', friendRequest: updated });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Xoá lời mời kết bạn
exports.deleteFrendRequest = async (req, res) => {
    try {
        const userId = req.user.id; // userId lấy từ JWT token
        const { requestId } = req.params;

        const result = await friendService.deleteFriendRequest(userId, requestId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: err.message });
    }
}

// Get thông tin dữ liệu kết bạn
exports.getReceiverPendingRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await friendService.getReceiverPending(userId);
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(400).json({ message: 'Lỗi hệ thống' });
    }
}


// Get thông tin dữ liệu kết bạn
exports.getPendingRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await friendService.getPending(userId);
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(400).json({ message: 'Lỗi hệ thống' });
    }
}

exports.getAcceptedRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await friendService.getAccepted(userId);
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(400).json({ message: 'Lỗi hệ thống' });
    }
}

exports.getBlockedRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await friendService.getBlocked(userId);
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(400).json({ message: 'Lỗi hệ thống' });
    }
}

exports.getRejectedRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await friendService.getRejected(userId);
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(400).json({ message: 'Lỗi hệ thống' });
    }
}


exports.getStangers = async (req, res) => {
    try {
        const userId = req.user.id;
        const users = await friendService.getUsersWithoutFriendRequest(userId);
        
        res.json({
            message: "Danh sách người chưa có bất kỳ kết bạn nào với bạn",
            users
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getAccepteBirthdays = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await friendService.getAccepteBirthday(userId);
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(400).json({ message: 'Lỗi hệ thống' });
    }
}