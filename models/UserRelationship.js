const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tình trạng user
const UserRelationship = sequelize.define('UserRelationship', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    partnerId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('single', 'dating', 'married'),
        allowNull: false
    },
    anniversary: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isConfirmed: { // xác nhận mối quan hệ
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'user_relationships',
    timestamps: true
});

module.exports = UserRelationship;