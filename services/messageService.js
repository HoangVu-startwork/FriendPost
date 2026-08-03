const Conversation = require('../models/Conversation');
const Participant = require('../models/Participant');
const Message = require('../models/Message');
const FriendRequest = require('../models/FriendRequest');
const { Sequelize, Op } = require('sequelize');
const ChatStatus = require('../models/ChatStatus');
const User = require('../models/User');
const { uploadToCloudinary } = require('./cloudinaryService');
const conversationService = require('./conversationService')


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

exports.sendMessageimage = async (senderId, receiverId, content, contentType, fileBuffer = null, originalName = null, replyToId = null, conversationId = null, io) => {
    console.log(conversationId);
    if (senderId === receiverId) {

        if (!conversationId) {
            throw new Error("Phải cung cấp conversationId khi gửi cho chính mình.");
        }

        // Kiểm tra conversation có tồn tại không
        const conversation = await Conversation.findByPk(conversationId);

        if (!conversation) {
            throw new Error("Conversation không tồn tại.");
        }

        let uploadedUrl = null;
        let meta = null;
        let finalContentType = 'text';
        let finalContent = content;

        if (fileBuffer) {
            const uploadResult = await uploadToCloudinary(
                fileBuffer,
                'messages',
                originalName
            );

            uploadedUrl = uploadResult.url;
            const format = uploadResult.format?.toLowerCase();
            finalContent = uploadedUrl;

            if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(format)) {
                finalContentType = "image";
            }
            else if (["mp4", "mov", "avi", "mkv", "webm"].includes(format)) {
                finalContentType = "video";
            }
            else {
                finalContentType = "file";
            }

            meta = { format };
        }

        const message = await Message.create({
            conversationId: conversationId,  // 👈 dùng id frontend truyền lên
            senderId,
            content: finalContent,
            contentType: finalContentType,
            replyToId: replyToId || null,
            message_status: 'show',
            meta
        });

        return {
            message,
            chatStatus: null,
            warning: false,
            notice: null,
        };
    }
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

    let uploadedUrl = null;
    let meta = null;
    let finalContentType = 'text';
    let finalContent = content;

    if (fileBuffer) {
        const uploadResult = await uploadToCloudinary(
            fileBuffer,
            'messages',
            originalName
        );

        uploadedUrl = uploadResult.url;
        meta = { type: uploadResult.type };
        const format = uploadResult.format?.toLowerCase();
        finalContent = uploadedUrl;

        if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(format)) {
            finalContentType = "image";
        }
        else if (["mp4", "mov", "avi", "mkv", "webm"].includes(format)) {
            finalContentType = "video";
        }
        else {
            finalContentType = "file";
        }

        meta = { format };
    } else {
        finalContentType = 'text';
    }

    // 6️⃣ Tạo message (nếu là ảnh thì content là URL ảnh)
    const message = await Message.create({
        conversationId: conversation.id,
        senderId,
        // content: contentType === 'image' ? uploadedUrl : content,
        content: finalContent,
        contentType: finalContentType,
        replyToId: replyToId || null,
        message_status: messageStatus,
        meta,
    });

    // Lấy lại message kèm sender
    const messageWithSender = await Message.findByPk(message.id, {
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'email', 'avatUrl']
            }
        ]
    });

    // Format thời gian theo kiểu "HH:mm:ss dd-MM-yyyy"
    const formatDate = (date) => {
        const d = new Date(date);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    }

    const plainMsg = messageWithSender.toJSON();

    // 🔥 Object gửi qua socket (giống API get)
    const formattedMessage = {
        id: plainMsg.id,
        conversationId: plainMsg.conversationId,
        content: plainMsg.content,
        sender: {
            username: plainMsg.sender?.username,
            id: plainMsg.sender?.id,
            avatUrl: plainMsg.sender?.avatUrl,
        },
        message_status: plainMsg.message_status,
        contentType: plainMsg.contentType,
        status: plainMsg.status,
        createdAt: formatDate(plainMsg.createdAt),
        updatedAt: formatDate(plainMsg.updatedAt),
        replyToId: plainMsg.replyToId,
        senderId: plainMsg.senderId
    };

    io.to(`conversation_${conversation.id}`).emit("newConversationmes", formattedMessage);

    io.to(`user_${senderId}`).emit("conversationUpdated", {
        conversationId: conversation.id,
        lastMessage: formattedMessage
    });
    
    io.to(`user_${receiverId}`).emit("conversationUpdated", {
        conversationId: conversation.id,
        lastMessage: formattedMessage
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

///

///
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
                attributes: ['id', 'username', 'email', 'avatUrl']
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
                attributes: ['id', 'username', 'email', 'avatUrl']
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
        // 🚫 Nếu là delete → không ai thấy
        if (msg.message_status === 'delete') {
            return false;
        }

        // 🔒 Nếu là block → chỉ người gửi thấy
        if (msg.message_status === 'block') {
            return msg.senderId === userId;
        }
        return true; // "show" hoặc trạng thái khác ai cũng thấy
    });

    // 🔹 Chuyển dữ liệu sang object để dễ quản lý theo id
    // 🔹 Trả về danh sách phẳng (không replies)
    const result = filteredMessages.map(msg => {
        const plainMsg = msg.toJSON();

        return {
            id: plainMsg.id,
            content: plainMsg.content,
            sender: {
                username: plainMsg.sender?.username,
                id: plainMsg.sender?.id,
                avatUrl: plainMsg.sender?.avatUrl,
            },
            message_status: plainMsg.message_status,
            contentType: plainMsg.contentType,
            isRead: plainMsg.isRead,
            status: plainMsg.status,
            createdAt: formatDate(plainMsg.createdAt),
            updatedAt: formatDate(plainMsg.updatedAt),
            replyToId: plainMsg.replyToId,
            senderId: plainMsg.senderId
        };
    });

    return result;
};

// đánh dấu tất cả tin nhắn đã đọc từ đầu cuộc hội thoại đến một tin nhắn cuối cùng
exports.markAsReadUpTo = async (userId, conversationId, lastMessageId) => {
    // Kiểm tra conversation tồn tại
    const conversation = await Conversation.findByPk(conversationId);

    if (!conversation) {
        throw new Error("Conversation không tồn tại");
    }

    // Kiểm tra user có thuộc conversation không
    let isMember = false;

    if (conversation.type === "private") {
        isMember =
            conversation.userOneId === userId ||
            conversation.userTwoId === userId;
    }

    if (conversation.type === "group") {
        // Vì bạn chưa có bảng ConversationMember
        // tạm thời cho phép mọi user nếu cần,
        // hoặc bạn phải tự thiết kế thêm bảng member.
        throw new Error("Chưa hỗ trợ group membership check");
    }

    if (!isMember) {
        throw new Error("Bạn không thuộc cuộc trò chuyện này");
    }

    // 3️⃣ Update tin nhắn của người kia
    const [updatedCount] = await Message.update(
        {
            isRead: true,
            readAt: new Date(),
            status: "read"
        },
        {
            where: {
                conversationId,
                senderId: { [Op.ne]: userId }, // quan trọng: không update tin của chính mình
                id: { [Op.lte]: lastMessageId },
                isRead: false
            }
        }
    );

    return updatedCount;
}


exports.getUnreadSummary = async (userId) => {
    const unreadMessages = await Message.findAll({
        where: {
            senderId: { [Op.ne]: userId },
            isRead: false
        },
        attributes: [
            "conversationId",
            "senderId",
            [Sequelize.fn("COUNT", Sequelize.col("id")), "unreadCount"]
        ],
        group: ["conversationId", "senderId"]
    });

    return unreadMessages;
}