// models/Message.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Conversation = require('./Conversation');
const User = require('./User');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contentType: { // 'text', 'image', 'file', etc.
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'text',
  },
  replyToId: { // trả lời tới message khác
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  meta: { // json field for attachments, extra data
    type: DataTypes.JSONB,
    allowNull: true,
  },
  status: { // optional per-message status
    type: DataTypes.ENUM('sent', 'delivered', 'read'),
    defaultValue: 'sent',
  },

  message_status: { // trạng thái tin nhắn 
    type: DataTypes.ENUM('show', 'delete', 'block'),
    allowNull: true,
  },

  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    { fields: ['conversationId'] },
    { fields: ['senderId'] },
  ]
});

// associations
module.exports = Message;
