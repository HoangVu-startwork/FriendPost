// models/FriendRequest.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FriendRequest = sequelize.define('FriendRequest', {
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
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
    allowNull: false,
    defaultValue: 'pending',
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
  tableName: 'friend_requests',
  timestamps: true,
  indexes: [
    // Tăng tốc truy vấn tìm theo senderId hoặc receiverId
    { fields: ['senderId'] },
    { fields: ['receiverId'] },

    // Index phức hợp (composite index) cho cặp (senderId, receiverId)
    { unique: true, fields: ['senderId', 'receiverId'], name: 'unique_friend_pair', },

    // Nếu bạn hay truy vấn theo trạng thái bạn bè (ví dụ danh sách bạn bè accepted)
    { fields: ['status'] },

    // Nếu bạn hay tìm những request gửi đến 1 người và còn pending
    { fields: ['receiverId', 'status'] },


  ]
});

module.exports = FriendRequest;


// Tác dụng của từng index
// - Index : senderId 
// - mục dích : Nhanh hơn khi tìm lời mời người dùng đã gửi 
// - where: { senderId }

// - Index : receiverId 
// - mục đích : Nhanh hơn khi tìm lời mời gửi đến người dùng 
// - where: { receiverId }

// - (senderId, receiverId)
// - mục đích : Nhanh hơn khi kiểm tra cặp bạn bè tồn tại
// - where: { senderId, receiverId }

// - status
// - Hữu ích nếu lọc theo trạng thái (accepted, pending, ...)
// - where: { status: 'pending' }

// - (receiverId, status)
// - Dành cho danh sách yêu cầu kết bạn còn chờ xử lý
// - where: { receiverId, status: 'pending' }