const Conversation = require('../models/Conversation');
const Participant = require('../models/Participant');
const Message = require('../models/Message');
const FriendRequest = require('../models/FriendRequest');
const { Sequelize, Op } = require('sequelize');
const ChatStatus = require('../models/ChatStatus');
const User = require('../models/User');
const { uploadToCloudinary } = require('./cloudinaryService');


exports.sendMessage1 = async (senderId, receiverId, content, replyToId = null) => {
    // 1️⃣ Kiểm tra quan hệ bạn bè
    const isFriend = await FriendRequest.findOne({
        where: {
            [Op.or]: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ],
            status: 'accepted'
        }
    });

    // 2️⃣ Tìm hoặc tạo Conversation 1:1
    let conversation = await Conversation.findOne({
        where: {
            type: 'private',
            [Op.or]: [
                { userOneId: senderId, userTwoId: receiverId },
                { userOneId: receiverId, userTwoId: senderId },
            ],
        },
    });

    if (!conversation) {
        conversation = await Conversation.create({
            type: 'private',
            userOneId: senderId,
            userTwoId: receiverId,
            createdBy: senderId,
        });
    }

    // 3️⃣ Kiểm tra hoặc tạo ChatStatus
    let chatStatus = await ChatStatus.findOne({
        where: { conversationId: conversation.id },
    });

    if (!chatStatus) {
        chatStatus = await ChatStatus.create({
            conversationId: conversation.id,
            userOneId: senderId,
            userTwoId: receiverId,
            status: isFriend ? 'normal' : 'not_friends',
            blockedBy: null,
            blockedAt: null,
        });
    }

    // 4️⃣ Xác định trạng thái message dựa theo ChatStatus
    const messageStatus =
        chatStatus.status === 'blocked' ? 'block' : 'show';

    // 5️⃣ Tạo message
    const message = await Message.create({
        conversationId: conversation.id,
        senderId,
        content,
        // replyToId: replyToId || null,
        contentType: 'text',
        message_status: messageStatus, // 👈 Set theo trạng thái chat
    });

    return {
        message,
        chatStatus,
        warning: !isFriend,
        notice: !isFriend
            ? '⚠️ Bạn chưa kết bạn với người này. Vui lòng gửi lời mời kết bạn.'
            : null,
    };
};

exports.sendMessageimage = async (senderId, receiverId, content, contentType = 'text', filePath = null, replyToId = null) => {
    // 1️⃣ Kiểm tra quan hệ bạn bè
    const isFriend = await FriendRequest.findOne({
        where: {
            [Op.or]: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ],
            status: 'accepted'
        }
    });

    // 2️⃣ Tìm hoặc tạo Conversation 1:1
    let conversation = await Conversation.findOne({
        where: {
            type: 'private',
            [Op.or]: [
                { userOneId: senderId, userTwoId: receiverId },
                { userOneId: receiverId, userTwoId: senderId },
            ],
        },
    });

    if (!conversation) {
        conversation = await Conversation.create({
            type: 'private',
            userOneId: senderId,
            userTwoId: receiverId,
            createdBy: senderId,
        });
    }

    // 3️⃣ Kiểm tra hoặc tạo ChatStatus
    let chatStatus = await ChatStatus.findOne({
        where: { conversationId: conversation.id },
    });

    if (!chatStatus) {
        chatStatus = await ChatStatus.create({
            conversationId: conversation.id,
            userOneId: senderId,
            userTwoId: receiverId,
            status: isFriend ? 'normal' : 'not_friends',
            blockedBy: null,
            blockedAt: null,
        });
    }

    // 4️⃣ Xác định trạng thái message dựa theo ChatStatus
    const messageStatus = chatStatus.status === 'blocked' ? 'block' : 'show';

    // 5️⃣ Upload ảnh nếu contentType === 'image'
    let uploadedUrl = null;
    let meta = null;

    if (contentType === 'image' && filePath) {
        const uploadResult = await uploadToCloudinary(filePath, 'messages');
        uploadedUrl = uploadResult.url;
        meta = { type: uploadResult.type };
    }

    // 6️⃣ Tạo message (nếu là ảnh thì content là URL ảnh)
    const message = await Message.create({
        conversationId: conversation.id,
        senderId,
        content: contentType === 'image' ? uploadedUrl : content,
        contentType,
        replyToId: replyToId || null,
        message_status: messageStatus,
        meta,
    });

    return {
        message,
        chatStatus,
        warning: !isFriend,
        notice: !isFriend
            ? '⚠️ Bạn chưa kết bạn với người này. Vui lòng gửi lời mời kết bạn.'
            : null,
    };
}

exports.sendMessage = async (senderId, receiverId, content, replyToId = null) => {
    // 1️⃣ Kiểm tra quan hệ bạn bè
    const isFriend = await FriendRequest.findOne({
        where: {
            [Op.or]: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ],
            status: 'accepted'
        }
    });

    // 2️⃣ Tìm hoặc tạo Conversation 1:1
    let conversation = await Conversation.findOne({
        where: {
            type: 'private',
            [Op.or]: [
                { userOneId: senderId, userTwoId: receiverId },
                { userOneId: receiverId, userTwoId: senderId },
            ],
        },
    });

    if (!conversation) {
        conversation = await Conversation.create({
            type: 'private',
            userOneId: senderId,
            userTwoId: receiverId,
            createdBy: senderId,
        });
    }

    // 3️⃣ Kiểm tra hoặc tạo ChatStatus
    let chatStatus = await ChatStatus.findOne({
        where: { conversationId: conversation.id },
    });

    if (!chatStatus) {
        chatStatus = await ChatStatus.create({
            conversationId: conversation.id,
            userOneId: senderId,
            userTwoId: receiverId,
            status: isFriend ? 'normal' : 'not_friends',
            blockedBy: null,
            blockedAt: null,
        });
    }

    // 4️⃣ Xác định trạng thái message dựa theo ChatStatus
    const messageStatus =
        chatStatus.status === 'blocked' ? 'block' : 'show';

    // 5️⃣ Tạo message (thêm replyToId)
    const message = await Message.create({
        conversationId: conversation.id,
        senderId,
        content,
        replyToId: replyToId || null, // ✅ Cho phép trả lời tin nhắn cụ thể
        contentType: 'text',
        message_status: messageStatus,
    });

    return {
        message,
        chatStatus,
        warning: !isFriend,
        notice: !isFriend
            ? '⚠️ Bạn chưa kết bạn với người này. Vui lòng gửi lời mời kết bạn.'
            : null,
    };
};


exports.getConversationMessages = async (userId, conversationId) => {
    // Kiểm tra cuộc trò chuyện tồn tại
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
        throw new Error('Không tìm thấy cuộc trò chuyện');
    }

    // Kiểm tra quyền truy cập
    if (conversation.type === 'private') {
        const { userOneId, userTwoId } = conversation;
        if (![userOneId, userTwoId].includes(userId)) {
            throw new Error('Bạn không có quyền xem cuộc trò chuyện này');
        }
    }

    // Lấy toàn bộ tin nhắn và replies
    const messages = await Message.findAll({
        where: { conversationId },
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'email']
            }
        ],
        order: [['createdAt', 'ASC']]
    });

    // Hàm format thời gian theo kiểu "HH:mm:ss dd-MM-yyyy"
    const formatDate = (date) => {
        const d = new Date(date);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    };

    // Chuyển dữ liệu sang object để dễ quản lý theo id
    const messageMap = {};
    const rootMessages = [];

    messages.forEach(msg => {
        const plainMsg = msg.toJSON();

        messageMap[plainMsg.id] = {
            id: plainMsg.id,
            content: plainMsg.content,
            sender: { username: plainMsg.sender?.username },
            message_status: plainMsg.message_status,
            createdAt: formatDate(plainMsg.createdAt),
            updatedAt: formatDate(plainMsg.updatedAt),
            replyToId: plainMsg.replyToId,
            replies: [],
        };
    });

    // Ghép replies vào tin nhắn cha (hỗ trợ nhiều cấp)
    Object.values(messageMap).forEach(msg => {
        if (msg.replyToId && messageMap[msg.replyToId]) {
            messageMap[msg.replyToId].replies.push(msg);
        } else {
            rootMessages.push(msg);
        }
    });

    return rootMessages;
};

exports.getConversationMessagesblock = async (userId, conversationId) => {
    // 🔹 Kiểm tra cuộc trò chuyện tồn tại
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
        throw new Error('Không tìm thấy cuộc trò chuyện');
    }

    // 🔹 Kiểm tra quyền truy cập
    if (conversation.type === 'private') {
        const { userOneId, userTwoId } = conversation;
        if (![userOneId, userTwoId].includes(userId)) {
            throw new Error('Bạn không có quyền xem cuộc trò chuyện này');
        }
    }

    // 🔹 Lấy toàn bộ tin nhắn và replies
    const messages = await Message.findAll({
        where: { conversationId },
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'email']
            }
        ],
        order: [['createdAt', 'ASC']]
    });

    // 🔹 Hàm format thời gian theo kiểu "HH:mm:ss dd-MM-yyyy"
    const formatDate = (date) => {
        const d = new Date(date);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    };

    // 🔹 Lọc tin nhắn theo trạng thái block
    const filteredMessages = messages.filter(msg => {
        if (msg.message_status === 'block') {
            // Chỉ người gửi mới được thấy tin nhắn này
            return msg.senderId === userId;
        }
        return true; // "show" hoặc trạng thái khác ai cũng thấy
    });

    // 🔹 Chuyển dữ liệu sang object để dễ quản lý theo id
    const messageMap = {};
    const rootMessages = [];

    filteredMessages.forEach(msg => {
        const plainMsg = msg.toJSON();

        messageMap[plainMsg.id] = {
            id: plainMsg.id,
            content: plainMsg.content,
            sender: { username: plainMsg.sender?.username },
            message_status: plainMsg.message_status,
            createdAt: formatDate(plainMsg.createdAt),
            updatedAt: formatDate(plainMsg.updatedAt),
            replyToId: plainMsg.replyToId,
            replies: [],
        };
    });

    // 🔹 Ghép replies vào tin nhắn cha (hỗ trợ nhiều cấp)
    Object.values(messageMap).forEach(msg => {
        if (msg.replyToId && messageMap[msg.replyToId]) {
            messageMap[msg.replyToId].replies.push(msg);
        } else {
            rootMessages.push(msg);
        }
    });

    return rootMessages;
};
