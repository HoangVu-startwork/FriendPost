const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Thông tin giới thiệu
const UserInforation = sequelize.define('UserInforation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    accommodation: {
        type: DataTypes.STRING,
        allowNull: false
    },
    introduce: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'user_inforation',
    timestamps: true
});

module.exports = UserInforation;