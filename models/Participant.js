// models/Participant.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Conversation = require('./Conversation');
const User = require('./User');

const Participant = sequelize.define('Participant', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // role: 'member' | 'admin' etc.
  role: {
    type: DataTypes.ENUM('member', 'coadmin', 'leader'),
    allowNull: false,
    defaultValue: 'member',
  },
  lastReadMessageId: { // optional: để tracking read receipts
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  tableName: 'participants',
  timestamps: true,
  indexes: [
    { fields: ['conversationId'] },
    { fields: ['userId'] },
    { unique: true, fields: ['conversationId', 'userId'] } // tránh duplicate participant
  ]
});

module.exports = Participant;
