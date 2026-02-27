const ConversationService = require('../services/conversationService');

exports.getMyConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await ConversationService.getUserConversations(userId);

        return res.status(200).json({
            success: true,
            data: conversations
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get conversations'
        });
    }
};

exports.createGroup = async (req, res, next) => {
    try {
        const { name, participantIds } = req.body;
        const creatorId = req.user.id;

        if (!name) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        const conversation = await ConversationService.createGroupConversation({
            name,
            participantIds,
            creatorId
        });

        res.status(201).json({
            message: 'Group conversation created',
            conversation
        });
    } catch (err) {
        next(err);
    }
};

exports.updateName = async (req, res) => {
    try {
        const {newName, conversationId} = req.body;
        const userId = req.user.id;

        const groupName = await ConversationService.updateGroupName({
            conversationId,
            newName,
            userId
        });

        res.status(201).json({
            message: 'Group conversation created',
            groupName
        });
    } catch (err) {

    }
}

// Thêm user vào nhóm có thể thêm 1 user hoặc có thêm nhiều user
exports.addUserParticipants = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { userIds, role } = req.body
        const requesterId = req.user.id;

        const particpants = await ConversationService.addUserToGroup({
            conversationId,
            userIds,
            requesterId,
            role
        });

        res.status(201).json({
            message: 'Users added successfully',
            particpants
        });
    } catch (err) {
        next(err);
    }
}