// models/RolePermission.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  roleId: { type: DataTypes.INTEGER, allowNull: false },
  permissionId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'role_permissions',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['roleId','permissionId'] }
  ]
});

module.exports = RolePermission;
