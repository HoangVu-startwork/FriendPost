// models/Permission.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  action: { type: DataTypes.STRING, unique: true, allowNull: false }, // ex: create_post, approve_post
  description: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'permissions',
  timestamps: true
});

module.exports = Permission;
