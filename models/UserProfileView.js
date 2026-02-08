// models/UserProfileView.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProfileView = sequelize.define('UserProfileView', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  viewerId: { // người đi xem
    type: DataTypes.INTEGER,
    allowNull: false
  },

  targetId: { // người bị xem profile
    type: DataTypes.INTEGER,
    allowNull: false
  },

  viewCount: { // xem bao nhiêu lần
    type: DataTypes.INTEGER,
    defaultValue: 1
  }

}, {
  tableName: 'user_profile_views',
  timestamps: true,

  // mỗi cặp viewer - target chỉ có 1 dòng
  indexes: [
    {
      unique: true,
      fields: ['viewerId', 'targetId']
    }
  ]
});

module.exports = UserProfileView;
