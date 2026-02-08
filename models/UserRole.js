// models/UserRole.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserRole = sequelize.define('UserRole', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  roleId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'user_roles',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'roleId'] } // tránh gán trùng
  ]
});

module.exports = UserRole;
