// services/conversationService.js
const { Op, fn, col, literal } = require('sequelize');
// Op -> Toán tử SQL (OR, AND, IN , ...);
// fn -> gọi hàm SQL (MAX, count, ...);
// col -> chỉ định cột trong DB
// literal -> Viết SQL, không qua O
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Participant = require('../models/Participant');
const { sequelize, Role } = require('../models');
const Topic = require('../models/Topic');

// Chức năng: Hàm này lấy danh sách các cuộc trò chuyện (Conversation) của một user, và:
// Xác định cuộc trò chuyện nào liên quan tới user
// Tìm thời điểm tin nhắn mới nhất trong mỗi conversation
// Sắp xếp conversation sao cho: 
// => Có tin nhắn → nổi lên trên
// => Tin nhắn mới nhất → đứng đầu
// => Conversation chưa có tin nhắn → tụt xuống dưới

exports.getUserConversations = async (userId) => {
    const conversations = await Conversation.findAll({
        where: {
            [Op.or]: [
                { userOneId: userId },
                { userTwoId: userId },
                { createdBy: userId }
            ]
        },

        include: [
            {
                model: Message,
                as: 'messages',
                attributes: [],
                required: false
            },
            {
                model: User,
                as: 'userOne',
                attributes: ['id', 'username', 'avatUrl']
            },
            {
                model: User,
                as: 'userTwo',
                attributes: ['id', 'username', 'avatUrl']
            },
            {
                model: Topic,
                as: 'topic',
                attributes: ['id', 'label', 'title', 'img', 'color', 'color_1', 'color_2', 'color_icon'],
                required: false
            }
        ],

        attributes: {
            include: [
                [fn('MAX', col('messages.createdAt')), 'lastMessageAt']
            ]
        },

        // ⚠️ BẮT BUỘC thêm userOne.id và userTwo.id vào group
        group: [
            'Conversation.id',
            'userOne.id',
            'userTwo.id',
            'topic.id'
        ],

        order: [
            [literal('MAX("messages"."createdAt") IS NULL'), 'ASC'],
            [fn('MAX', col('messages.createdAt')), 'DESC'],
            ['createdAt', 'DESC']
        ]
    });

    return conversations.map(conv => {
        const plain = conv.get({ plain: true });

        let friend = null;

        if (plain.userOneId === userId) {
            friend = plain.userTwo;
        } else {
            friend = plain.userOne;
        }

        // Xoá 2 field không cần thiết
        delete plain.userOne;
        delete plain.userTwo;

        return {
            ...plain,
            friend
        };
    });
};



exports.createGroupConversation = async ({ name, participantIds = [], creatorId }) => {
    return await sequelize.transaction(async (t) => {
        // Tạo conversation
        const conversation = await Conversation.create(
            {
                type: 'group',
                name,
                createdBy: creatorId
            },
            { transaction: t }
        );

        // Leader
        const participants = [
            {
                conversationId: conversation.id,
                userId: creatorId,
                role: 'leader'
            }
        ];

        // Members loại trùng creator
        const uniqueIds = [...new Set(participantIds)].filter(id => id !== creatorId);

        for (const userId of uniqueIds) {
            participants.push({
                conversationId: conversation.id,
                userId,
                role: 'member'
            });
        }

        await Participant.bulkCreate(participants, { transaction: t });

        return conversation;
    })
}


// User cập nhật name
exports.updateGroupName = async ({
    conversationId,
    newName,
    userId
}) => {
    if (!newName, !newName.trim()) {
        throw new Error('Tên nhóm là bắt buộc');
    }

    const conversation = await Conversation.findByPk(conversationId);

    if (!conversation) {
        throw new Error('Không tìm thấy cuộc trò chuyện');
    }

    if (conversation.type !== 'group') {
        throw new Error('Không thể đổi tên cuộc trò chuyện riêng tư');
    }

    const participant = await Participant.findOne({
        where: {
            conversationId,
            userId: userId
        }
    });

    if (!participant) {
        throw new Error('Bạn không phải là thành viên của nhóm này.')
    }

    // Chỉnh có user có role là Leader
    if (participant.role !== 'leader') {
        throw new Error('Chỉ người lãnh đạo mới có thể đổi tên nhóm này.');
    }

    conversation.name = newName.trim();
    await conversation.save();

    return conversation;
}

// Viết thêm user vào conversation
exports.addUserToGroup = async ({ conversationId, userIds, requesterId, role = 'member' }) => {
    // Chuẩn hoá đầu vào
    const normalizedIds = Array.isArray(userIds) ? userIds : [userIds];

    if (!normalizedIds.length) {
        throw new Error('Bạn chưa chọn user');
    }

    return await sequelize.transaction(async (t) => {
        // Xác thực cuộc trò chuyện
        const conversation = await Conversation.findOne({
            where: { id: conversationId, type: 'group' },
            transaction: t
        });

        if (!conversation) {
            throw new Error('Không tìm thấy cuộc trò chuyện nhóm');
        }

        // Kiểm tra leader quyền user đang đăng nhập
        const leader = await Participant.findOne({
            where: {
                conversationId,
                userId: requesterId,
                role: 'leader'
            },
            transaction: t
        });

        if (!leader) {
            throw new Error('Chỉ người quản trị mới có thể thêm người dùng.');
        }

        // Loại trùng và loại chính leader
        const uniqueIds = [...new Set(normalizedIds)].filter(id => id && id != requesterId);

        if (!uniqueIds.length) {
            return { added: [], skipped: [] };
        }

        // Tìm user đã tồn tại
        const existing = await Participant.findAll({
            where: {
                conversationId,
                userId: { [Op.in]: uniqueIds }
            },
            attributes: ['userId'],
            transaction: t
        });

        const existingIds = existing.map(p => p.userId);

        const newIds = uniqueIds.filter(
            id => !existingIds.includes(id)
        );

        // 6️⃣ Bulk insert
        let created = [];
        if (newIds.length) {
            created = await Participant.bulkCreate(
                newIds.map(userId => ({
                    conversationId,
                    userId,
                    role
                })),
                { transaction: t }
            );
        }

        return {
            added: created.map(p => p.userId),
            skipped: existingIds
        };
    });
}