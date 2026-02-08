// models/NotifyRequest.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotifyRequest = sequelize.define('NotifyRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  friendRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('show_1', 'show_2'),
    allowNull: false,
    defaultValue: 'show_1',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'notify_requests',
  timestamps: true,
});

module.exports = NotifyRequest;