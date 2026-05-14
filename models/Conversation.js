// models/Conversation.js
// Conversation là bảng trung tâm dùng để quản lý phòng chat trong hệ thống.
// - Một cuộc trò chuyện giữa 2 người (1:1)
// - Một nhóm chat nhiều người
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  }, // Mã định danh duy nhất cho mỗi cuộc trò chuyện

  type: { // Loại cuộc trò chuyện: private (1:1) hay group
    type: DataTypes.ENUM('private', 'group'),
    allowNull: false,
    defaultValue: 'private',
  },

  title: { // Tiêu đề nhóm (nếu là group)
    type: DataTypes.STRING,
    allowNull: true,
  },

  avatConversation: {
    type: DataTypes.STRING,
    allowNull: true
  },

  createdBy: { // ID người tạo nhóm (group owner)
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  leaderId: { // (Tùy chọn) ID của nhóm trưởng, có thể trùng createdBy
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  userOneId: { //  // (Tùy chọn) 2 trường này chỉ áp dụng khi type = 'private'
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  userTwoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  topicId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  icon: {
    type: DataTypes.STRING,
    defaultValue: '👍'
  }
  
}, {
  tableName: 'conversations',
  timestamps: true,
});

module.exports = Conversation;
