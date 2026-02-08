const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Quản lý trạng thái tin nhắn
const ChatStatus = sequelize.define('ChatStatus', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    conversationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    // Người thứ nhất (user 1)
    userOneId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    // Người thứ hai (user 2)
    userTwoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    // Trạng thái nhắn tin: bình thường hoặc chặn
    status: {
        type: DataTypes.ENUM('normal', 'blocked', 'not_friends', 'pending', 'muted', 'archived'),
        allowNull: false,
        defaultValue: 'normal'
    },

    // Nếu bị chặn thì ai là người chặn
    blockedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    // Thời điểm bị chặn
    blockedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'chat_status',
    timestamps: true
});


module.exports = ChatStatus;